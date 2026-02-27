-- AutoClaim Pro MySQL Schema

CREATE DATABASE IF NOT EXISTS autoclaim_pro;
USE autoclaim_pro;

-- Claims Table
CREATE TABLE IF NOT EXISTS claims (
    id VARCHAR(50) PRIMARY KEY,
    owner VARCHAR(255),
    phone VARCHAR(50),
    car VARCHAR(255),
    incidentDate DATE,
    status VARCHAR(50),
    riskLevel VARCHAR(20),
    coverage DECIMAL(15, 2),
    location VARCHAR(255),
    description TEXT,
    neuralSummary TEXT,
    consistencyScore INT,
    insurancePaid BOOLEAN DEFAULT FALSE,
    paymentDetails JSON,
    scratchpad TEXT,
    damageReason TEXT,
    damagedParts JSON,
    statementAgreement JSON,
    submittedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Notes Table
CREATE TABLE IF NOT EXISTS notes (
    id VARCHAR(50) PRIMARY KEY,
    claimId VARCHAR(50),
    text TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    visibleToRepairer BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (claimId) REFERENCES claims(id) ON DELETE CASCADE
);

-- Evidence Table
CREATE TABLE IF NOT EXISTS evidence (
    id VARCHAR(50) PRIMARY KEY,
    claimId VARCHAR(50),
    name VARCHAR(255),
    type VARCHAR(100),
    data LONGTEXT, -- Base64 data
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (claimId) REFERENCES claims(id) ON DELETE CASCADE
);

-- Staff Table
CREATE TABLE IF NOT EXISTS staff (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255),
    role VARCHAR(50),
    email VARCHAR(255),
    avatar VARCHAR(10),
    rating DECIMAL(3, 2),
    totalClaims INT DEFAULT 0,
    `load` INT DEFAULT 0,
    complianceStatus VARCHAR(50),
    interventions JSON
);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(50) PRIMARY KEY,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    action VARCHAR(100),
    details JSON
);
