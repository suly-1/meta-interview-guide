import mysql from "mysql2/promise";

const conn = await mysql.createConnection({
  host: "gateway01.eu-central-1.prod.aws.tidbcloud.com",
  port: 4000,
  user: "4mRUkub4BAh5A1p.root",
  password: "4qKSrYYfOFDAgCtU",
  database: "test",
  ssl: { rejectUnauthorized: true },
});

await conn.execute(`
  CREATE TABLE IF NOT EXISTS \`user_scores\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`userId\` int NOT NULL,
    \`patternRatings\` json NOT NULL,
    \`behavioralRatings\` json NOT NULL,
    \`starNotes\` json NOT NULL,
    \`patternTime\` json NOT NULL,
    \`interviewDate\` varchar(16),
    \`targetLevel\` varchar(8),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT \`user_scores_id\` PRIMARY KEY(\`id\`),
    CONSTRAINT \`user_scores_userId_unique\` UNIQUE(\`userId\`)
  )
`);
console.log("Created user_scores");

await conn.end();
