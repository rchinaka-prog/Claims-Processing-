import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, "db.json");
const STAFF_PATH = path.join(__dirname, "staff.json");
const AUDIT_PATH = path.join(__dirname, "audit.json");
const USERS_PATH = path.join(__dirname, "users.json");

// MySQL Connection Pool (Lazy initialized)
let pool: mysql.Pool | null = null;
let mysqlAvailable = true;

const getPool = () => {
  if (!mysqlAvailable) return null;
  
  // If DB_HOST is not set, we don't even try
  if (!process.env.DB_HOST) {
    mysqlAvailable = false;
    return null;
  }

  if (!pool) {
    try {
      pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'autoclaim_pro',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 2000 
      });
    } catch (e) {
      mysqlAvailable = false;
      return null;
    }
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
  if (mysqlPool && mysqlAvailable) {
    try {
      const [rows] = await mysqlPool.query('SELECT * FROM claims');
      return rows;
    } catch (e: any) {
      if (e.code === 'ECONNREFUSED' || e.code === 'ETIMEDOUT') {
        mysqlAvailable = false;
      } else {
        console.error("MySQL getClaims query failed", e);
      }
    }
  }
  return readJSON(DB_PATH, { claims: [] }).claims;
};

export const getClaimById = async (id: string) => {
  const mysqlPool = getPool();
  if (mysqlPool && mysqlAvailable) {
    try {
      const [claims] = await mysqlPool.query('SELECT * FROM claims WHERE id = ?', [id]);
      const claim = (claims as any[])[0];
      if (claim) {
        const [notes] = await mysqlPool.query('SELECT * FROM notes WHERE claimId = ?', [id]);
        const [evidence] = await mysqlPool.query('SELECT * FROM evidence WHERE claimId = ?', [id]);
        return { ...claim, notes, evidence };
      }
      return null;
    } catch (e: any) {
      if (e.code === 'ECONNREFUSED' || e.code === 'ETIMEDOUT') {
        mysqlAvailable = false;
      } else {
        console.error("MySQL getClaimById failed", e);
      }
    }
  }
  const db = readJSON(DB_PATH, { claims: [] });
  return db.claims.find((c: any) => c.id === id) || null;
};

export const updateClaim = async (id: string, updates: any) => {
  const mysqlPool = getPool();
  if (mysqlPool && mysqlAvailable) {
    try {
      const keys = Object.keys(updates);
      const values = Object.values(updates);
      const setClause = keys.map(key => `\`${key}\` = ?`).join(', ');
      const mappedValues = values.map(v => (typeof v === 'object' && v !== null) ? JSON.stringify(v) : v);
      await mysqlPool.query(`UPDATE claims SET ${setClause} WHERE id = ?`, [...mappedValues, id]);
      
      // Log status change to repairEvidence if status updated
      if (updates.status || updates.assignedAssessor) {
        const claim = await getClaimById(id);
        const evidence = JSON.parse(claim.repairEvidence || '[]');
        
        if (updates.status) {
          evidence.unshift({
            id: `ev-${Date.now()}-status`,
            title: `Status: ${updates.status}`,
            description: `Claim status transitioned to ${updates.status}.`,
            date: new Date().toLocaleString()
          });
        }
        
        if (updates.assignedAssessor) {
          evidence.unshift({
            id: `ev-${Date.now()}-assessor`,
            title: 'Assessor Assigned',
            description: `${updates.assignedAssessor} has been assigned to this claim.`,
            date: new Date().toLocaleString()
          });
        }

        await mysqlPool.query('UPDATE claims SET repairEvidence = ? WHERE id = ?', [JSON.stringify(evidence), id]);
      }

      return await getClaimById(id);
    } catch (e: any) {
      if (e.code === 'ECONNREFUSED' || e.code === 'ETIMEDOUT') {
        mysqlAvailable = false;
      } else {
        console.error("MySQL updateClaim failed", e);
      }
    }
  }
  const db = readJSON(DB_PATH, { claims: [] });
  const index = db.claims.findIndex((c: any) => c.id === id);
  if (index !== -1) {
    const oldStatus = db.claims[index].status;
    const oldAssessor = db.claims[index].assignedAssessor;
    db.claims[index] = { ...db.claims[index], ...updates };
    
    if ((updates.status && updates.status !== oldStatus) || (updates.assignedAssessor && updates.assignedAssessor !== oldAssessor)) {
      db.claims[index].repairEvidence = db.claims[index].repairEvidence || [];
      
      if (updates.status && updates.status !== oldStatus) {
        db.claims[index].repairEvidence.unshift({
          id: `ev-${Date.now()}-status`,
          title: `Status: ${updates.status}`,
          description: `Claim status transitioned to ${updates.status}.`,
          date: new Date().toLocaleString()
        });
      }
      
      if (updates.assignedAssessor && updates.assignedAssessor !== oldAssessor) {
        db.claims[index].repairEvidence.unshift({
          id: `ev-${Date.now()}-assessor`,
          title: 'Assessor Assigned',
          description: `${updates.assignedAssessor} has been assigned to this claim.`,
          date: new Date().toLocaleString()
        });
      }
    }

    writeJSON(DB_PATH, db);
    return db.claims[index];
  }
  return null;
};

export const addNote = async (claimId: string, note: any) => {
  const mysqlPool = getPool();
  if (mysqlPool && mysqlAvailable) {
    try {
      await mysqlPool.query(
        'INSERT INTO notes (id, claimId, text, timestamp, visibleToRepairer) VALUES (?, ?, ?, ?, ?)',
        [note.id, claimId, note.text, new Date(), note.visibleToRepairer]
      );
      return note;
    } catch (e: any) {
      if (e.code === 'ECONNREFUSED' || e.code === 'ETIMEDOUT') {
        mysqlAvailable = false;
      } else {
        console.error("MySQL addNote failed", e);
      }
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
  if (mysqlPool && mysqlAvailable) {
    try {
      await mysqlPool.query(
        'INSERT INTO evidence (id, claimId, name, type, data, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
        [evidence.id, claimId, evidence.name, evidence.type, evidence.data, new Date()]
      );
      return evidence;
    } catch (e: any) {
      if (e.code === 'ECONNREFUSED' || e.code === 'ETIMEDOUT') {
        mysqlAvailable = false;
      } else {
        console.error("MySQL addEvidence failed", e);
      }
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
  if (mysqlPool && mysqlAvailable) {
    try {
      const [rows] = await mysqlPool.query('SELECT * FROM staff');
      return rows;
    } catch (e: any) {
      if (e.code === 'ECONNREFUSED' || e.code === 'ETIMEDOUT') {
        mysqlAvailable = false;
      } else {
        console.error("MySQL getStaff failed", e);
      }
    }
  }
  return readJSON(STAFF_PATH, { staff: [] }).staff;
};

export const addStaff = async (member: any) => {
  const mysqlPool = getPool();
  if (mysqlPool && mysqlAvailable) {
    try {
      await mysqlPool.query(
        'INSERT INTO staff (id, name, role, email, avatar, rating, totalClaims, `load`, complianceStatus, interventions) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [member.id, member.name, member.role, member.email, member.avatar, member.rating, member.totalClaims, member.load, member.complianceStatus, JSON.stringify(member.interventions)]
      );
      return member;
    } catch (e: any) {
      if (e.code === 'ECONNREFUSED' || e.code === 'ETIMEDOUT') {
        mysqlAvailable = false;
      } else {
        console.error("MySQL addStaff failed", e);
      }
    }
  }
  const db = readJSON(STAFF_PATH, { staff: [] });
  db.staff.push(member);
  writeJSON(STAFF_PATH, db);
  return member;
};

export const addIntervention = async (staffId: string, intervention: any) => {
  const mysqlPool = getPool();
  if (mysqlPool && mysqlAvailable) {
    try {
      const [staff] = await mysqlPool.query('SELECT interventions FROM staff WHERE id = ?', [staffId]);
      const currentInterventions = JSON.parse((staff as any[])[0].interventions || '[]');
      currentInterventions.unshift(intervention);
      await mysqlPool.query('UPDATE staff SET interventions = ? WHERE id = ?', [JSON.stringify(currentInterventions), staffId]);
      return intervention;
    } catch (e: any) {
      if (e.code === 'ECONNREFUSED' || e.code === 'ETIMEDOUT') {
        mysqlAvailable = false;
      } else {
        console.error("MySQL addIntervention failed", e);
      }
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
  if (mysqlPool && mysqlAvailable) {
    try {
      const [rows] = await mysqlPool.query('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100');
      return rows;
    } catch (e: any) {
      if (e.code === 'ECONNREFUSED' || e.code === 'ETIMEDOUT') {
        mysqlAvailable = false;
      } else {
        console.error("MySQL getAuditLogs failed", e);
      }
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
  if (mysqlPool && mysqlAvailable) {
    try {
      await mysqlPool.query(
        'INSERT INTO audit_logs (id, timestamp, action, details) VALUES (?, ?, ?, ?)',
        [entry.id, new Date(), entry.action, JSON.stringify(entry.details)]
      );
      return entry;
    } catch (e: any) {
      if (e.code === 'ECONNREFUSED' || e.code === 'ETIMEDOUT') {
        mysqlAvailable = false;
      } else {
        console.error("MySQL logAuditEntry failed", e);
      }
    }
  }
  
  const audit = readJSON(AUDIT_PATH, { logs: [] });
  audit.logs.unshift(entry);
  writeJSON(AUDIT_PATH, audit);
  return entry;
};

export const createClaim = async (claim: any) => {
  const mysqlPool = getPool();
  if (mysqlPool && mysqlAvailable) {
    try {
      const keys = Object.keys(claim);
      const values = Object.values(claim);
      const columns = keys.map(key => `\`${key}\``).join(', ');
      const placeholders = keys.map(() => '?').join(', ');
      const mappedValues = values.map(v => (typeof v === 'object' && v !== null) ? JSON.stringify(v) : v);
      
      await mysqlPool.query(`INSERT INTO claims (${columns}) VALUES (${placeholders})`, mappedValues);
      return await getClaimById(claim.id);
    } catch (e: any) {
      if (e.code === 'ECONNREFUSED' || e.code === 'ETIMEDOUT') {
        mysqlAvailable = false;
      } else {
        console.error("MySQL createClaim failed", e);
      }
    }
  }
  const db = readJSON(DB_PATH, { claims: [] });
  db.claims.push(claim);
  writeJSON(DB_PATH, db);
  return claim;
};

export const assignAssessor = async (claimId: string, assessorId: string) => {
  const mysqlPool = getPool();
  // In a real system, we'd fetch the assessor name from a staff table.
  // For this demo, we'll use a map or just the ID if name not found.
  const assessorMap: Record<string, string> = {
    'AS-882': 'Marcus Flint',
    'AS-883': 'Sarah Jenkins',
    'AS-884': 'Terrence Moyo',
    'AS-885': 'Brian Phiri'
  };
  const assessorName = assessorMap[assessorId] || assessorId;

  if (mysqlPool && mysqlAvailable) {
    try {
      const claim = await getClaimById(claimId);
      const evidence = JSON.parse(claim.repairEvidence || '[]');
      evidence.unshift({
        id: `ev-${Date.now()}`,
        title: 'Assessor Assigned',
        description: `${assessorName} has been assigned to conduct the field audit.`,
        date: new Date().toLocaleString()
      });

      await mysqlPool.query(
        'UPDATE claims SET assignedAssessor = ?, status = ?, progress = ?, repairEvidence = ? WHERE id = ?',
        [assessorName, 'Reviewing', 40, JSON.stringify(evidence), claimId]
      );
      return await getClaimById(claimId);
    } catch (e: any) {
      if (e.code === 'ECONNREFUSED' || e.code === 'ETIMEDOUT') {
        mysqlAvailable = false;
      } else {
        console.error("MySQL assignAssessor failed", e);
      }
    }
  }
  const db = readJSON(DB_PATH, { claims: [] });
  const index = db.claims.findIndex((c: any) => c.id === claimId);
  if (index !== -1) {
    db.claims[index].assignedAssessor = assessorName;
    db.claims[index].status = 'Reviewing';
    db.claims[index].progress = 40;
    db.claims[index].repairEvidence = db.claims[index].repairEvidence || [];
    db.claims[index].repairEvidence.unshift({
      id: `ev-${Date.now()}`,
      title: 'Assessor Assigned',
      description: `${assessorName} has been assigned to conduct the field audit.`,
      date: new Date().toLocaleString()
    });
    writeJSON(DB_PATH, db);
    return db.claims[index];
  }
  return null;
};

// --- User Management ---

export const getUserByEmail = async (email: string) => {
  const mysqlPool = getPool();
  if (mysqlPool && mysqlAvailable) {
    try {
      const [rows] = await mysqlPool.query('SELECT * FROM users WHERE email = ?', [email]);
      return (rows as any[])[0] || null;
    } catch (e: any) {
      if (e.code === 'ECONNREFUSED' || e.code === 'ETIMEDOUT') {
        mysqlAvailable = false;
      } else {
        console.error("MySQL getUserByEmail failed", e);
      }
    }
  }
  const db = readJSON(USERS_PATH, { users: [] });
  return db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase()) || null;
};

export const getUsers = async () => {
  const mysqlPool = getPool();
  if (mysqlPool && mysqlAvailable) {
    try {
      const [rows] = await mysqlPool.query('SELECT * FROM users');
      return rows as any[];
    } catch (e: any) {
      if (e.code === 'ECONNREFUSED' || e.code === 'ETIMEDOUT') {
        mysqlAvailable = false;
      } else {
        console.error("MySQL getUsers failed", e);
      }
    }
  }
  return readJSON(USERS_PATH, { users: [] }).users;
};

export const updateUser = async (id: string, updates: any) => {
  const mysqlPool = getPool();
  if (mysqlPool && mysqlAvailable) {
    try {
      const keys = Object.keys(updates);
      const values = Object.values(updates);
      const setClause = keys.map(key => `\`${key}\` = ?`).join(', ');
      await mysqlPool.query(`UPDATE users SET ${setClause} WHERE id = ?`, [...values, id]);
      return true;
    } catch (e: any) {
      if (e.code === 'ECONNREFUSED' || e.code === 'ETIMEDOUT') {
        mysqlAvailable = false;
      } else {
        console.error("MySQL updateUser failed", e);
      }
    }
  }
  const db = readJSON(USERS_PATH, { users: [] });
  const index = db.users.findIndex((u: any) => u.id === id);
  if (index !== -1) {
    db.users[index] = { ...db.users[index], ...updates };
    writeJSON(USERS_PATH, db);
    return true;
  }
  return false;
};

export const createUser = async (user: any) => {
  const mysqlPool = getPool();
  if (mysqlPool && mysqlAvailable) {
    try {
      const keys = Object.keys(user);
      const values = Object.values(user);
      const columns = keys.map(key => `\`${key}\``).join(', ');
      const placeholders = keys.map(() => '?').join(', ');
      await mysqlPool.query(`INSERT INTO users (${columns}) VALUES (${placeholders})`, values);
      return await getUserByEmail(user.email);
    } catch (e: any) {
      if (e.code === 'ECONNREFUSED' || e.code === 'ETIMEDOUT') {
        mysqlAvailable = false;
      } else {
        console.error("MySQL createUser failed", e);
      }
    }
  }
  const db = readJSON(USERS_PATH, { users: [] });
  db.users.push(user);
  writeJSON(USERS_PATH, db);
  return user;
};
