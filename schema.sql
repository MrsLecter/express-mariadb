DROP TABLE IF EXISTS user_score_stats;
DROP TABLE IF EXISTS scores;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE scores (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  value INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_scores_user
    FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_scores_user_id (user_id)
);

CREATE TABLE user_score_stats (
  user_id BIGINT PRIMARY KEY,
  total_score BIGINT NOT NULL DEFAULT 0,
  scores_count INT NOT NULL DEFAULT 0,
  last_activity DATETIME NOT NULL,
  CONSTRAINT fk_user_score_stats_user
    FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_user_score_stats_ranking (total_score DESC, user_id ASC)
);
