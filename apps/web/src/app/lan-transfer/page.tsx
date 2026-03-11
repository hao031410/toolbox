'use client';

import Link from 'next/link';
import {
  ChangeEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  createLanTransferSession,
  getClientName,
  joinLanTransferSession,
  pollLanTransferMessages,
  sendLanTransferMessage,
  type LanTransferMessage,
} from '@/lib/toolbox-api';

type Scene = 'entry' | 'connect' | 'session';
type EntryMode = 'create' | 'join';

type OutboundFileItem = {
  id: string;
  file: File;
  name: string;
  sizeLabel: string;
  progress: number;
  status: '等待发送' | '传输中' | '已发送' | '失败';
};

type InboundFileItem = {
  id: string;
  name: string;
  sizeLabel: string;
  progress: number;
  status: '接收中' | '已接收';
  downloadUrl?: string;
};

type IncomingTransfer = {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  chunks: BlobPart[];
  receivedBytes: number;
};

const flowSteps: { key: Scene; index: string; title: string; description: string }[] = [
  { key: 'entry', index: '01', title: '建立连接', description: '创建或加入' },
  { key: 'connect', index: '02', title: '完成配对', description: '输入短码' },
  { key: 'session', index: '03', title: '进入会话', description: '双向传输' },
];

const entryModeContent: Record<
  EntryMode,
  {
    kicker: string;
    title: string;
    action: string;
    summary: string;
  }
> = {
  create: {
    kicker: 'Create Connection',
    title: '先创建一个临时连接',
    action: '创建连接',
    summary: '当前设备发起连接',
  },
  join: {
    kicker: 'Join Connection',
    title: '输入短码，直接加入已有连接',
    action: '加入连接',
    summary: '输入对方短码加入',
  },
};

const chunkSize = 64 * 1024;

function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export default function LanTransferPage() {
  const [entryMode, setEntryMode] = useState<EntryMode>('create');
  const [scene, setScene] = useState<Scene>('entry');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [peerLabel, setPeerLabel] = useState('等待连接');
  const [selfLabel, setSelfLabel] = useState('当前设备');
  const [statusLabel, setStatusLabel] = useState('未建连');
  const [statusTone, setStatusTone] = useState<'pending' | 'live' | 'done'>(
    'pending',
  );
  const [expiresAtLabel, setExpiresAtLabel] = useState('--');
  const [speedLabel, setSpeedLabel] = useState('--');
  const [connectionLabel, setConnectionLabel] = useState('未建立');
  const [errorMessage, setErrorMessage] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [outboundFiles, setOutboundFiles] = useState<OutboundFileItem[]>([]);
  const [inboundFiles, setInboundFiles] = useState<InboundFileItem[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const sessionIdRef = useRef('');
  const clientIdRef = useRef('');
  const cursorRef = useRef(0);
  const pollingRef = useRef<number | null>(null);
  const pollingBusyRef = useRef(false);
  const connectionRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RTCDataChannel | null>(null);
  const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const isInitiatorRef = useRef(false);
  const hasSentOfferRef = useRef(false);
  const sendingRef = useRef(false);
  const incomingTransferRef = useRef<IncomingTransfer | null>(null);
  const outboundQueueRef = useRef<OutboundFileItem[]>([]);
  const objectUrlsRef = useRef<string[]>([]);
  const selfDeviceNameRef = useRef('Browser Device');

  async function postSignal(type: string, payload?: unknown) {
    if (!sessionIdRef.current || !clientIdRef.current) {
      return;
    }

    await sendLanTransferMessage(
      sessionIdRef.current,
      clientIdRef.current,
      type,
      payload,
    );
  }

  function stopPolling() {
    if (pollingRef.current !== null) {
      window.clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }

  function closeConnection() {
    channelRef.current?.close();
    connectionRef.current?.close();
    channelRef.current = null;
    connectionRef.current = null;
    pendingIceCandidatesRef.current = [];
    isInitiatorRef.current = false;
    hasSentOfferRef.current = false;
    incomingTransferRef.current = null;
  }

  function resetTransferState() {
    outboundQueueRef.current = [];
    setOutboundFiles([]);
    setInboundFiles((current) => {
      current.forEach((item) => {
        if (item.downloadUrl) {
          URL.revokeObjectURL(item.downloadUrl);
        }
      });
      return [];
    });
  }

  function updateConnectionStatus(
    label: string,
    tone: 'pending' | 'live' | 'done',
    connectionState?: string,
  ) {
    setStatusLabel(label);
    setStatusTone(tone);
    if (connectionState) {
      setConnectionLabel(connectionState);
    }
  }

  async function processOutboundQueue() {
    const channel = channelRef.current;

    if (!channel || channel.readyState !== 'open' || sendingRef.current) {
      return;
    }

    sendingRef.current = true;

    while (outboundQueueRef.current.length > 0 && channel.readyState === 'open') {
      const fileItem = outboundQueueRef.current.shift();

      if (!fileItem) {
        break;
      }

      setOutboundFiles((current) =>
        current.map((item) =>
          item.id === fileItem.id
            ? { ...item, status: '传输中', progress: 0 }
            : item,
        ),
      );

      channel.send(
        JSON.stringify({
          kind: 'file-meta',
          id: fileItem.id,
          name: fileItem.name,
          size: fileItem.file.size,
          mimeType: fileItem.file.type || 'application/octet-stream',
        }),
      );

      let offset = 0;

      while (offset < fileItem.file.size && channel.readyState === 'open') {
        if (channel.bufferedAmount > chunkSize * 8) {
          await sleep(30);
          continue;
        }

        const chunk = await fileItem.file
          .slice(offset, offset + chunkSize)
          .arrayBuffer();

        channel.send(chunk);
        offset += chunk.byteLength;

        const progress = Math.round((offset / fileItem.file.size) * 100);
        setOutboundFiles((current) =>
          current.map((item) =>
            item.id === fileItem.id ? { ...item, progress } : item,
          ),
        );
      }

      if (channel.readyState !== 'open') {
        setOutboundFiles((current) =>
          current.map((item) =>
            item.id === fileItem.id ? { ...item, status: '失败' } : item,
          ),
        );
        break;
      }

      channel.send(JSON.stringify({ kind: 'file-complete', id: fileItem.id }));
      setOutboundFiles((current) =>
        current.map((item) =>
          item.id === fileItem.id
            ? { ...item, status: '已发送', progress: 100 }
            : item,
        ),
      );
    }

    sendingRef.current = false;
  }

  function handleBinaryChunk(chunk: ArrayBuffer) {
    const transfer = incomingTransferRef.current;

    if (!transfer) {
      return;
    }

    transfer.chunks.push(chunk);
    transfer.receivedBytes += chunk.byteLength;

    const progress = Math.min(
      100,
      Math.round((transfer.receivedBytes / transfer.size) * 100),
    );

    setInboundFiles((current) =>
      current.map((item) =>
        item.id === transfer.id ? { ...item, progress } : item,
      ),
    );
  }

  function handleControlMessage(raw: string) {
    let message:
      | {
          kind?: string;
          id?: string;
          name?: string;
          size?: number;
          mimeType?: string;
          clientName?: string;
        }
      | undefined;

    try {
      message = JSON.parse(raw) as typeof message;
    } catch {
      return;
    }

    if (!message?.kind) {
      return;
    }

    if (message.kind === 'peer-intro' && message.clientName) {
      setPeerLabel(message.clientName);
      return;
    }

    if (
      message.kind === 'file-meta' &&
      message.id &&
      message.name &&
      typeof message.size === 'number'
    ) {
      const transferId = message.id;
      const transferName = message.name;
      const transferSize = message.size;
      const transferMimeType = message.mimeType || 'application/octet-stream';

      incomingTransferRef.current = {
        id: transferId,
        name: transferName,
        size: transferSize,
        mimeType: transferMimeType,
        chunks: [],
        receivedBytes: 0,
      };

      setInboundFiles((current) => [
        ...current.filter((item) => item.id !== transferId),
        {
          id: transferId,
          name: transferName,
          sizeLabel: formatBytes(transferSize),
          progress: 0,
          status: '接收中',
        },
      ]);
      return;
    }

    if (message.kind === 'file-complete' && message.id) {
      const transfer = incomingTransferRef.current;

      if (!transfer || transfer.id !== message.id) {
        return;
      }

      const blob = new Blob(transfer.chunks, { type: transfer.mimeType });
      const downloadUrl = URL.createObjectURL(blob);
      objectUrlsRef.current.push(downloadUrl);

      setInboundFiles((current) =>
        current.map((item) =>
          item.id === transfer.id
            ? {
                ...item,
                progress: 100,
                status: '已接收',
                downloadUrl,
              }
            : item,
        ),
      );

      incomingTransferRef.current = null;
    }
  }

  function configureDataChannel(channel: RTCDataChannel) {
    channel.binaryType = 'arraybuffer';
    channelRef.current = channel;

    channel.onopen = () => {
      setScene('session');
      setErrorMessage('');
      updateConnectionStatus('会话进行中', 'live', '已连接');
      setSpeedLabel('可传输');
      channel.send(
        JSON.stringify({
          kind: 'peer-intro',
          clientName: selfDeviceNameRef.current,
        }),
      );
      void processOutboundQueue();
    };

    channel.onclose = () => {
      setSpeedLabel('--');
      updateConnectionStatus('连接已关闭', 'pending', '已断开');
    };

    channel.onerror = () => {
      setErrorMessage('数据通道异常，请重新建立连接。');
      updateConnectionStatus('连接异常', 'pending', '连接异常');
    };

    channel.onmessage = (event) => {
      if (typeof event.data === 'string') {
        handleControlMessage(event.data);
        return;
      }

      if (event.data instanceof ArrayBuffer) {
        handleBinaryChunk(event.data);
      }
    };
  }

  async function handleSignalMessage(message: LanTransferMessage) {
    const connection = connectionRef.current;

    if (!connection) {
      return;
    }

    if (message.type === 'peer-joined') {
      const payload = message.payload as { clientName?: string } | undefined;
      setPeerLabel(payload?.clientName || '对端已加入');
      updateConnectionStatus('正在建连', 'live', '连接中');

      if (
        isInitiatorRef.current &&
        !hasSentOfferRef.current &&
        !connection.localDescription
      ) {
        hasSentOfferRef.current = true;
        const offer = await connection.createOffer();
        await connection.setLocalDescription(offer);
        await postSignal('offer', offer);
      }

      return;
    }

    if (message.type === 'offer') {
      const payload = message.payload as RTCSessionDescriptionInit | undefined;

      if (!payload) {
        return;
      }

      await connection.setRemoteDescription(payload);
      for (const candidate of pendingIceCandidatesRef.current) {
        await connection.addIceCandidate(candidate);
      }
      pendingIceCandidatesRef.current = [];
      const answer = await connection.createAnswer();
      await connection.setLocalDescription(answer);
      await postSignal('answer', answer);
      updateConnectionStatus('正在建连', 'live', '连接中');
      return;
    }

    if (message.type === 'answer') {
      const payload = message.payload as RTCSessionDescriptionInit | undefined;

      if (!payload || connection.currentRemoteDescription) {
        return;
      }

      await connection.setRemoteDescription(payload);
      for (const candidate of pendingIceCandidatesRef.current) {
        await connection.addIceCandidate(candidate);
      }
      pendingIceCandidatesRef.current = [];
      updateConnectionStatus('正在建连', 'live', '连接中');
      return;
    }

    if (message.type === 'ice-candidate') {
      const payload = message.payload as RTCIceCandidateInit | undefined;

      if (!payload) {
        return;
      }

      if (!connection.remoteDescription) {
        pendingIceCandidatesRef.current.push(payload);
        return;
      }

      try {
        await connection.addIceCandidate(payload);
      } catch {
        setErrorMessage('ICE 候选同步失败，请重试。');
      }
    }
  }

  function startPolling(sessionId: string, clientId: string) {
    stopPolling();
    cursorRef.current = 0;

    pollingRef.current = window.setInterval(async () => {
      if (pollingBusyRef.current) {
        return;
      }

      pollingBusyRef.current = true;

      try {
        const response = await pollLanTransferMessages(
          sessionId,
          clientId,
          cursorRef.current,
        );

        cursorRef.current = response.nextCursor;
        setExpiresAtLabel(new Date(response.expiresAt).toLocaleTimeString());

        for (const message of response.messages) {
          await handleSignalMessage(message);
        }
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : '轮询连接状态失败。',
        );
      } finally {
        pollingBusyRef.current = false;
      }
    }, 1000);
  }

  async function setupPeerConnection(isInitiator: boolean) {
    closeConnection();
    pendingIceCandidatesRef.current = [];
    isInitiatorRef.current = isInitiator;
    hasSentOfferRef.current = false;

    const connection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });
    connectionRef.current = connection;

    connection.onicecandidate = (event) => {
      if (event.candidate) {
        void postSignal('ice-candidate', event.candidate.toJSON());
      }
    };

    connection.onconnectionstatechange = () => {
      const state = connection.connectionState;

      if (state === 'connected') {
        setScene('session');
        updateConnectionStatus('会话进行中', 'live', '已连接');
      } else if (state === 'connecting') {
        updateConnectionStatus('正在建连', 'live', '连接中');
      } else if (state === 'failed' || state === 'disconnected') {
        updateConnectionStatus('连接异常', 'pending', '连接中断');
        setErrorMessage('连接已断开，请重新建立连接。');
      }
    };

    connection.ondatachannel = (event) => {
      configureDataChannel(event.channel);
    };

    if (isInitiator) {
      const channel = connection.createDataChannel('file-transfer', {
        ordered: true,
      });
      configureDataChannel(channel);
    }
  }

  async function handleCreateConnection() {
    setIsBusy(true);
    setErrorMessage('');
    resetTransferState();

    try {
      const clientName = getClientName();
      selfDeviceNameRef.current = clientName;
      setSelfLabel(clientName);

      const session = await createLanTransferSession(clientName);
      sessionIdRef.current = session.sessionId;
      clientIdRef.current = session.clientId;
      setJoinCode(session.joinCode);
      setExpiresAtLabel(new Date(session.expiresAt).toLocaleTimeString());
      setScene('connect');
      setPeerLabel('等待对端加入');
      updateConnectionStatus('等待对端加入', 'pending', '等待中');
      await setupPeerConnection(true);
      startPolling(session.sessionId, session.clientId);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : '创建连接失败。',
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function handleJoinConnection() {
    const normalizedCode = joinCodeInput.replace(/\s+/g, '');

    if (normalizedCode.length !== 6) {
      setErrorMessage('请输入 6 位短码。');
      return;
    }

    setIsBusy(true);
    setErrorMessage('');
    resetTransferState();

    try {
      const clientName = getClientName();
      selfDeviceNameRef.current = clientName;
      setSelfLabel(clientName);

      const session = await joinLanTransferSession(normalizedCode, clientName);
      sessionIdRef.current = session.sessionId;
      clientIdRef.current = session.clientId;
      setJoinCode(session.joinCode);
      setExpiresAtLabel(new Date(session.expiresAt).toLocaleTimeString());
      setScene('connect');
      setPeerLabel('等待对端信令');
      updateConnectionStatus('准备加入', 'pending', '等待中');
      await setupPeerConnection(false);
      startPolling(session.sessionId, session.clientId);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '加入连接失败。');
    } finally {
      setIsBusy(false);
    }
  }

  function handlePickFiles() {
    fileInputRef.current?.click();
  }

  function handleFilesSelected(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files || []);

    if (!selectedFiles.length) {
      return;
    }

    const nextItems = selectedFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
      name: file.name,
      sizeLabel: formatBytes(file.size),
      progress: 0,
      status: '等待发送' as const,
    }));

    outboundQueueRef.current.push(...nextItems);
    setOutboundFiles((current) => [...current, ...nextItems]);

    if (channelRef.current?.readyState === 'open') {
      void processOutboundQueue();
    }

    event.target.value = '';
  }

  useEffect(() => {
    const clientName = getClientName();
    const objectUrls = objectUrlsRef.current;
    selfDeviceNameRef.current = clientName;
    setSelfLabel(clientName);

    return () => {
      stopPolling();
      closeConnection();
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  return (
    <div className="site-shell">
      <header className="site-header fade-up">
        <Link className="brand" href="/">
          <span className="brand-mark" aria-hidden="true" />
          <span className="brand-text">你的工具箱</span>
        </Link>
        <nav className="main-nav" aria-label="主导航">
          <Link href="/">首页</Link>
          <ThemeToggle />
        </nav>
      </header>

      <main className="main-content lan-page">
        <section className="page-intro lan-intro fade-up fade-delay-1">
          <p className="page-kicker">Local Transfer Tool</p>
          <h1>局域网文件传输</h1>
          <p>同一局域网内，先连上，再互传。</p>
        </section>

        <section className="lan-flow-bar fade-up fade-delay-2" aria-label="流程总览">
          {flowSteps.map((step) => (
            <div
              key={step.key}
              className={`lan-flow-step${scene === step.key ? ' is-active' : ''}`}
            >
              <span className="lan-flow-index">{step.index}</span>
              <div className="lan-flow-copy">
                <strong>{step.title}</strong>
                <span>{step.description}</span>
              </div>
            </div>
          ))}
        </section>

        {scene === 'entry' ? (
          <section className="lan-scene">
            <section className="lan-entry-grid fade-up fade-delay-2">
              {(['create', 'join'] as EntryMode[]).map((mode) => {
                const item = entryModeContent[mode];

                return (
                  <button
                    key={mode}
                    className={`lan-entry-card${entryMode === mode ? ' is-active' : ''}`}
                    type="button"
                    onClick={() => {
                      setEntryMode(mode);
                      setErrorMessage('');
                    }}
                  >
                    <div className="lan-entry-head">
                      <span className="lan-pill">{item.kicker}</span>
                      <span className="lan-dot" aria-hidden="true" />
                    </div>
                    <h2>{item.title}</h2>
                    <p>{item.summary}</p>
                  </button>
                );
              })}
            </section>

            <section className="lan-single-panel fade-up fade-delay-3">
              <article className="lan-panel lan-hero-panel">
                <div className="lan-card-head">
                  <div>
                    <p className="page-kicker">
                      {entryModeContent[entryMode].kicker}
                    </p>
                    <h2>{entryModeContent[entryMode].title}</h2>
                  </div>
                  <span className="lan-status-badge is-pending">未建连</span>
                </div>

                {entryMode === 'join' ? (
                  <label className="lan-code-field" htmlFor="join-code-input">
                    <span>输入 6 位短码</span>
                    <input
                      id="join-code-input"
                      type="text"
                      maxLength={6}
                      value={joinCodeInput}
                      onChange={(event) =>
                        setJoinCodeInput(
                          event.target.value.replace(/\D/g, '').slice(0, 6),
                        )
                      }
                      placeholder="248691"
                    />
                  </label>
                ) : null}

                <div className="lan-hero-actions">
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={() =>
                      entryMode === 'create'
                        ? void handleCreateConnection()
                        : void handleJoinConnection()
                    }
                    disabled={isBusy}
                  >
                    {isBusy ? '处理中...' : entryModeContent[entryMode].action}
                  </button>
                </div>

                {errorMessage ? <p className="lan-error-text">{errorMessage}</p> : null}
              </article>
            </section>
          </section>
        ) : null}

        {scene === 'connect' ? (
          <section className="lan-scene">
            <section className="lan-single-panel fade-up fade-delay-2">
              <article className="lan-panel">
                <div className="lan-card-head">
                  <div>
                    <p className="page-kicker">Pairing</p>
                    <h2>
                      {entryMode === 'create'
                        ? '短码已生成，等待对端加入'
                        : '正在等待对端信令'}
                    </h2>
                  </div>
                  <span className={`lan-status-badge is-${statusTone}`}>
                    {statusLabel}
                  </span>
                </div>

                <div className="lan-code-grid">
                  {entryMode === 'create' ? (
                    <div className="lan-code-field">
                      <span>当前短码</span>
                      <strong className="lan-code-box">{joinCode || '------'}</strong>
                    </div>
                  ) : (
                    <div className="lan-code-field">
                      <span>短码</span>
                      <strong className="lan-code-box">{joinCode || joinCodeInput || '------'}</strong>
                    </div>
                  )}

                  <div className="lan-hero-actions">
                    <button
                      className="btn btn-primary"
                      type="button"
                      onClick={() => {
                        if (connectionRef.current?.connectionState === 'connected') {
                          setScene('session');
                        }
                      }}
                    >
                      等待自动进入会话
                    </button>
                  </div>
                </div>

                <div className="lan-meta-grid">
                  <div>
                    <span>当前设备</span>
                    <strong>{selfLabel}</strong>
                  </div>
                  <div>
                    <span>对端</span>
                    <strong>{peerLabel}</strong>
                  </div>
                  <div>
                    <span>状态</span>
                    <strong>{connectionLabel}</strong>
                  </div>
                  <div>
                    <span>短码时效</span>
                    <strong>{expiresAtLabel}</strong>
                  </div>
                </div>

                {errorMessage ? <p className="lan-error-text">{errorMessage}</p> : null}
              </article>
            </section>
          </section>
        ) : null}

        {scene === 'session' ? (
          <section className="lan-scene">
            <section className="lan-session-layout fade-up fade-delay-2">
              <article className="lan-panel">
                <div className="lan-card-head">
                  <div>
                    <p className="page-kicker">Session Live</p>
                    <h2>连接已建立，双方都可发送与接收</h2>
                  </div>
                  <span className={`lan-status-badge is-${statusTone}`}>
                    {statusLabel}
                  </span>
                </div>

                <div className="lan-transfer-grid">
                  <section className="lan-transfer-card">
                    <div className="lan-files-head">
                      <h3>我发送的文件</h3>
                      <span className="lan-pill">Upload</span>
                    </div>
                    <div className="lan-dropzone">
                      <div className="lan-dropzone-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 16V6" />
                          <path d="m8 10 4-4 4 4" />
                          <path d="M5 18h14" />
                        </svg>
                      </div>
                      <div>
                        <h3>拖拽文件，立即发送给对方</h3>
                        <p>选择文件后直接发给对方。</p>
                      </div>
                      <div className="lan-hero-actions">
                        <button className="btn btn-primary" type="button" onClick={handlePickFiles}>
                          选择文件
                        </button>
                        <button
                          className="btn lan-muted-btn"
                          type="button"
                          onClick={() => {
                            outboundQueueRef.current = [];
                            setOutboundFiles([]);
                          }}
                        >
                          清空
                        </button>
                      </div>
                    </div>

                    <ul className="lan-files-list">
                      {outboundFiles.length ? (
                        outboundFiles.map((file) => (
                          <li key={file.id} className="lan-file-row">
                            <div className="lan-files-head">
                              <strong>{file.name}</strong>
                              <span>{file.sizeLabel}</span>
                            </div>
                            <div className="lan-progress-track">
                              <span style={{ width: `${file.progress}%` }} />
                            </div>
                            <div className="lan-progress-meta">
                              <span>{file.status}</span>
                              <span>{file.progress}%</span>
                            </div>
                          </li>
                        ))
                      ) : (
                        <li className="lan-file-row">
                          <strong>还没有待发送文件</strong>
                          <span>连接建立后可直接选择文件开始发送。</span>
                        </li>
                      )}
                    </ul>
                  </section>

                  <section className="lan-transfer-card">
                    <div className="lan-files-head">
                      <h3>我接收的文件</h3>
                      <span className="lan-pill">Inbox</span>
                    </div>
                    <ul className="lan-files-list">
                      {inboundFiles.length ? (
                        inboundFiles.map((file) => (
                          <li key={file.id} className="lan-file-row">
                            <div className="lan-files-head">
                              <strong>{file.name}</strong>
                              <span>{file.sizeLabel}</span>
                            </div>
                            <div className="lan-progress-track">
                              <span style={{ width: `${file.progress}%` }} />
                            </div>
                            <div className="lan-progress-meta">
                              <span>{file.status}</span>
                              <span>{file.progress}%</span>
                            </div>
                            {file.downloadUrl ? (
                              <a
                                className="btn lan-download-btn"
                                href={file.downloadUrl}
                                download={file.name}
                              >
                                下载
                              </a>
                            ) : null}
                          </li>
                        ))
                      ) : (
                        <li className="lan-file-row">
                          <strong>还没有收到文件</strong>
                          <span>对方开始发送后，这里会实时显示接收进度。</span>
                        </li>
                      )}
                    </ul>
                  </section>
                </div>

                <div className="lan-session-meta-bar" aria-label="会话信息">
                  <span>{`对端 ${peerLabel}`}</span>
                  <span>{`短码 ${joinCode || '------'}`}</span>
                  <span>{speedLabel}</span>
                  <span>{connectionLabel}</span>
                </div>

                {errorMessage ? <p className="lan-error-text">{errorMessage}</p> : null}
              </article>
            </section>
          </section>
        ) : null}

        <input
          ref={fileInputRef}
          className="lan-hidden-input"
          type="file"
          multiple
          onChange={handleFilesSelected}
        />
      </main>
    </div>
  );
}
