import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, "db.json");
const STAFF_PATH = path.join(__dirname, "staff.json");
const AUDIT_PATH = path.join(__dirname, "audit.json");

// MySQL Connection Pool (Lazy initialized)
let pool: mysql.Pool | null = null;

const getPool = () => {
  if (!pool && process.env.DB_HOST) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }
  return pool;
};

// --- JSON Fallback Helpers ---
const readJSON = (filePath: string, defaultData: any) => {
  try {
    if (!fs.existsSync(filePath)) return defaultData;
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return defaultData;
  }
};

const writeJSON = (filePath: string, data: any) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
  }
};

// --- Unified DB Interface ---

export const getClaims = async () => {
  const mysqlPool = getPool();
  if (mysqlPool) {
    try {
      const [rows] = await mysqlPool.query('SELECT * FROM claims');
      // We need to fetch notes and evidence for each claim if needed, 
      // but for the list view, just the claims might be enough.
      // For simplicity in this refactor, we'll return rows.
      return rows;
    } catch (e) {
      console.error("MySQL getClaims failed, falling back to JSON", e);
    }
  }
  return readJSON(DB_PATH, { claims: [] }).claims;
};

export const getClaimById = async (id: string) => {
  const mysqlPool = getPool();
  if (mysqlPool) {
    try {
      const [claims] = await mysqlPool.query('SELECT * FROM claims WHERE id = ?', [id]);
      const claim = (claims as any[])[0];
      if (claim) {
        const [notes] = await mysqlPool.query('SELECT * FROM notes WHERE claimId = ?', [id]);
        const [evidence] = await mysqlPool.query('SELECT * FROM evidence WHERE claimId = ?', [id]);
        return { ...claim, notes, evidence };
      }
      return null;
    } catch (e) {
      console.error("MySQL getClaimById failed", e);
    }
  }
  const db = readJSON(DB_PATH, { claims: [] });
  return db.claims.find((c: any) => c.id === id) || null;
};

export const updateClaim = async (id: string, updates: any) => {
  const mysqlPool = getPool();
  if (mysqlPool) {
    try {
      const keys = Object.keys(updates);
      const values = Object.values(updates);
      const setClause = keys.map(key => `\`${key}\` = ?`).join(', ');
      const mappedValues = values.map(v => (typeof v === 'object' && v !== null) ? JSON.stringify(v) : v);
      await mysqlPool.query(`UPDATE claims SET ${setClause} WHERE id = ?`, [...mappedValues, id]);
      return await getClaimById(id);
    } catch (e) {
      console.error("MySQL updateClaim failed", e);
    }
  }
  const db = readJSON(DB_PATH, { claims: [] });
  const index = db.claims.findIndex((c: any) => c.id === id);
  if (index !== -1) {
    db.claims[index] = { ...db.claims[index], ...updates };
    writeJSON(DB_PATH, db);
    return db.claims[index];
  }
  return null;
};

export const addNote = async (claimId: string, note: any) => {
  const mysqlPool = getPool();
  if (mysqlPool) {
    try {
      await mysqlPool.query(
        'INSERT INTO notes (id, claimId, text, timestamp, visibleToRepairer) VALUES (?, ?, ?, ?, ?)',
        [note.id, claimId, note.text, new Date(), note.visibleToRepairer]
      );
      return note;
    } catch (e) {
      console.error("MySQL addNote failed", e);
    }
  }
  const db = readJSON(DB_PATH, { claims: [] });
  const index = db.claims.findIndex((c: any) => c.id === claimId);
  if (index !== -1) {
    db.claims[index].notes = db.claims[index].notes || [];
    db.claims[index].notes.push(note);
    writeJSON(DB_PATH, db);
    return note;
  }
  return null;
};

export const addEvidence = async (claimId: string, evidence: any) => {
  const mysqlPool = getPool();
  if (mysqlPool) {
    try {
      await mysqlPool.query(
        'INSERT INTO evidence (id, claimId, name, type, data, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
        [evidence.id, claimId, evidence.name, evidence.type, evidence.data, new Date()]
      );
      return evidence;
    } catch (e) {
      console.error("MySQL addEvidence failed", e);
    }
  }
  const db = readJSON(DB_PATH, { claims: [] });
  const index = db.claims.findIndex((c: any) => c.id === claimId);
  if (index !== -1) {
    db.claims[index].evidence = db.claims[index].evidence || [];
    db.claims[index].evidence.push(evidence);
    writeJSON(DB_PATH, db);
    return evidence;
  }
  return null;
};

export const getStaff = async () => {
  const mysqlPool = getPool();
  if (mysqlPool) {
    try {
      const [rows] = await mysqlPool.query('SELECT * FROM staff');
      return rows;
    } catch (e) {
      console.error("MySQL getStaff failed", e);
    }
  }
  return readJSON(STAFF_PATH, { staff: [] }).staff;
};

export const addStaff = async (member: any) => {
  const mysqlPool = getPool();
  if (mysqlPool) {
    try {
      await mysqlPool.query(
        'INSERT INTO staff (id, name, role, email, avatar, rating, totalClaims, `load`, complianceStatus, interventions) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [member.id, member.name, member.role, member.email, member.avatar, member.rating, member.totalClaims, member.load, member.complianceStatus, JSON.stringify(member.interventions)]
      );
      return member;
    } catch (e) {
      console.error("MySQL addStaff failed", e);
    }
  }
  const db = readJSON(STAFF_PATH, { staff: [] });
  db.staff.push(member);
  writeJSON(STAFF_PATH, db);
  return member;
};

export const addIntervention = async (staffId: string, intervention: any) => {
  const mysqlPool = getPool();
  if (mysqlPool) {
    try {
      const [staff] = await mysqlPool.query('SELECT interventions FROM staff WHERE id = ?', [staffId]);
      const currentInterventions = JSON.parse((staff as any[])[0].interventions || '[]');
      currentInterventions.unshift(intervention);
      await mysqlPool.query('UPDATE staff SET interventions = ? WHERE id = ?', [JSON.stringify(currentInterventions), staffId]);
      return intervention;
    } catch (e) {
      console.error("MySQL addIntervention failed", e);
    }
  }
  const db = readJSON(STAFF_PATH, { staff: [] });
  const index = db.staff.findIndex((s: any) => s.id === staffId);
  if (index !== -1) {
    db.staff[index].interventions.unshift(intervention);
    writeJSON(STAFF_PATH, db);
    return intervention;
  }
  return null;
};

export const getAuditLogs = async () => {
  const mysqlPool = getPool();
  if (mysqlPool) {
    try {
      const [rows] = await mysqlPool.query('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100');
      return rows;
    } catch (e) {
      console.error("MySQL getAuditLogs failed", e);
    }
  }
  return readJSON(AUDIT_PATH, { logs: [] }).logs;
};

export const logAuditEntry = async (action: string, details: any) => {
  const entry = {
    id: `AUDIT-${Date.now()}`,
    timestamp: new Date().toISOString(),
    action,
    details
  };

  const mysqlPool = getPool();
  if (mysqlPool) {
    try {
      await mysqlPool.query(
        'INSERT INTO audit_logs (id, timestamp, action, details) VALUES (?, ?, ?, ?)',
        [entry.id, new Date(), entry.action, JSON.stringify(entry.details)]
      );
      return entry;
    } catch (e) {
      console.error("MySQL logAuditEntry failed", e);
    }
  }
  
  const audit = readJSON(AUDIT_PATH, { logs: [] });
  audit.logs.unshift(entry);
  writeJSON(AUDIT_PATH, audit);
  return entry;
};
