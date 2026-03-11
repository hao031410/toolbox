import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';

type SessionClient = {
  id: string;
  name: string;
  joinedAt: string;
};

type SessionMessage = {
  cursor: number;
  senderId: string;
  type: string;
  payload?: unknown;
  createdAt: string;
};

type TransferSession = {
  id: string;
  joinCode: string;
  expiresAt: number;
  clients: SessionClient[];
  messages: SessionMessage[];
  nextCursor: number;
};

const SESSION_TTL_MS = 10 * 60 * 1000;

@Injectable()
export class LanTransferService {
  private readonly sessions = new Map<string, TransferSession>();

  createSession(clientName?: string) {
    this.cleanupExpiredSessions();

    const sessionId = randomUUID();
    const clientId = randomUUID();
    const joinCode = this.generateJoinCode();
    const expiresAt = Date.now() + SESSION_TTL_MS;

    const session: TransferSession = {
      id: sessionId,
      joinCode,
      expiresAt,
      clients: [
        {
          id: clientId,
          name: this.normalizeClientName(clientName, '创建者设备'),
          joinedAt: new Date().toISOString(),
        },
      ],
      messages: [],
      nextCursor: 1,
    };

    this.sessions.set(sessionId, session);

    return {
      sessionId,
      clientId,
      joinCode,
      expiresAt: new Date(expiresAt).toISOString(),
    };
  }

  joinSession(joinCode: string, clientName?: string) {
    this.cleanupExpiredSessions();

    const session = [...this.sessions.values()].find(
      (item) => item.joinCode === joinCode,
    );

    if (!session) {
      throw new NotFoundException('短码不存在或已失效。');
    }

    if (session.clients.length >= 2) {
      throw new BadRequestException('当前会话已满。');
    }

    const clientId = randomUUID();
    const client: SessionClient = {
      id: clientId,
      name: this.normalizeClientName(clientName, '加入设备'),
      joinedAt: new Date().toISOString(),
    };

    session.clients.push(client);
    this.pushMessage(session, clientId, 'peer-joined', {
      clientId,
      clientName: client.name,
    });

    return {
      sessionId: session.id,
      clientId,
      joinCode: session.joinCode,
      expiresAt: new Date(session.expiresAt).toISOString(),
    };
  }

  listMessages(sessionId: string, clientId: string, cursor = 0) {
    const session = this.getSession(sessionId);
    this.assertClient(session, clientId);

    const messages = session.messages.filter(
      (message) => message.cursor > cursor && message.senderId !== clientId,
    );

    return {
      messages,
      nextCursor: session.nextCursor - 1,
      expiresAt: new Date(session.expiresAt).toISOString(),
    };
  }

  postMessage(
    sessionId: string,
    clientId: string,
    type: string,
    payload?: unknown,
  ) {
    const session = this.getSession(sessionId);
    this.assertClient(session, clientId);
    this.pushMessage(session, clientId, type, payload);

    return { ok: true };
  }

  private getSession(sessionId: string) {
    this.cleanupExpiredSessions();

    const session = this.sessions.get(sessionId);

    if (!session) {
      throw new NotFoundException('会话不存在或已失效。');
    }

    return session;
  }

  private assertClient(session: TransferSession, clientId: string) {
    const exists = session.clients.some((client) => client.id === clientId);

    if (!exists) {
      throw new BadRequestException('当前客户端不在该会话中。');
    }
  }

  private pushMessage(
    session: TransferSession,
    senderId: string,
    type: string,
    payload?: unknown,
  ) {
    session.messages.push({
      cursor: session.nextCursor,
      senderId,
      type,
      payload,
      createdAt: new Date().toISOString(),
    });
    session.nextCursor += 1;
  }

  private cleanupExpiredSessions() {
    const now = Date.now();

    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.expiresAt <= now) {
        this.sessions.delete(sessionId);
      }
    }
  }

  private generateJoinCode() {
    let joinCode = '';

    do {
      joinCode = `${Math.floor(100000 + Math.random() * 900000)}`;
    } while (
      [...this.sessions.values()].some(
        (session) => session.joinCode === joinCode,
      )
    );

    return joinCode;
  }

  private normalizeClientName(name: string | undefined, fallback: string) {
    const value = name?.trim();
    return value ? value.slice(0, 40) : fallback;
  }
}
