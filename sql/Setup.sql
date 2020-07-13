# ==== Create and switch to openvpn-access database ==== #
DROP DATABASE IF EXISTS openvpn_access;
CREATE DATABASE openvpn_access;
USE openvpn_access;


# ==== Create user table ==== #
# A "user" represents someone who has access to a openvpn-access instance.
# This could be either the administrator who's able to manage other users
# or a "simple" user with vpn access.
#DROP TABLE IF EXISTS user;
CREATE TABLE user (
    id int NOT NULL AUTO_INCREMENT,
    created_at date NOT NULL DEFAULT CURDATE(),
    updated_at date NOT NULL DEFAULT CURRENT_TIMESTAMP(), # Gets truncated to date, that's ok

    # Administrator will have access to user-management, normal user
    # will only be able to change their credentials and view stats.
    type enum ('admin', 'user') NOT NULL,

    # Account state
    state enum ('activated', 'pending', 'deactivated') NOT NULL,

    # Credentials
    email varchar(320) NOT NULL UNIQUE, # See https://tools.ietf.org/html/rfc3696
    email_verified bool NOT NULL DEFAULT false,
    username tinytext NOT NULL UNIQUE,
    password tinytext NOT NULL,

    # It's possible to limit the user in a way he can only user a certain amount of
    # bytes in a specific time period.
    transfer_limit_period int UNSIGNED DEFAULT null, # Period in seconds
    transfer_limit_start date DEFAULT null, # At when the user will be able to use his account
    transfer_limit_end date DEFAULT null, # Expiry date for this period
    transfer_limit_bytes bigint DEFAULT null, # Amount of bytes the user will be able to use in a single period

    # Constraints
    PRIMARY KEY (id)
) ENGINE = INNODB,
  AUTO_INCREMENT = 1,
  CHARACTER SET utf8,
  COLLATE utf8_general_ci;


# ==== Create web-login attempt table ==== #
#DROP TABLE IF EXISTS login_attempt_web;
CREATE TABLE login_attempt_web (
    id int NOT NULL AUTO_INCREMENT,
    user_id int DEFAULT null,
    created_at date NOT NULL DEFAULT CURDATE(),

    # State, tried username and ip address
    state enum ('pass', 'fail') NOT NULL,
    username tinytext NOT NULL,
    ip_addr tinytext NOT NULL,

    # Constraints
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES user (id) ON DELETE CASCADE
) ENGINE = INNODB,
  AUTO_INCREMENT = 1,
  CHARACTER SET utf8,
  COLLATE utf8_general_ci;


# ==== Create login attempt table ==== #
#DROP TABLE IF EXISTS login_attempt_vpn;
CREATE TABLE login_attempt_vpn (
    id int NOT NULL AUTO_INCREMENT,
    user_id int DEFAULT null,
    created_at date NOT NULL DEFAULT CURDATE(),

    # Reason, tried username and ip address
    state enum ('empty_cred', 'bad_password', 'eof', 'no_user', 'pass') NOT NULL,
    username tinytext NOT NULL,
    ip_addr tinytext NOT NULL,

    # Constraints
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES user (id) ON DELETE CASCADE
) ENGINE = INNODB,
  AUTO_INCREMENT = 1,
  CHARACTER SET utf8,
  COLLATE utf8_general_ci;


# ==== Create user session table ==== #
# A "session" represents a single vpn-session.
#DROP TABLE IF EXISTS web_session;
CREATE TABLE web_session (
    id int NOT NULL AUTO_INCREMENT,
    user_id int NOT NULL,
    ip_addr tinytext NOT NULL,
    created_at date NOT NULL DEFAULT CURDATE(),

    # Session key
    token tinytext NOT NULL,

    # Constraints
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES user (id) ON DELETE CASCADE
) ENGINE = INNODB,
  AUTO_INCREMENT = 1,
  CHARACTER SET utf8,
  COLLATE utf8_general_ci;


# ==== Create vpn session table ==== #
# A "session" represents a single vpn-session.
#DROP TABLE IF EXISTS vpn_session;
CREATE TABLE vpn_session (
    id int NOT NULL AUTO_INCREMENT,
    user_id int NOT NULL,
    ip_addr tinytext NOT NULL,

    # Time range of connection
    created_at date NOT NULL DEFAULT CURDATE(),
    closed_at date DEFAULT null,

    # Total amount of bytes transferred during this session
    transferred bigint unsigned NOT NULL DEFAULT 0,

    # Constraints
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES user (id) ON DELETE CASCADE
) ENGINE = INNODB,
  AUTO_INCREMENT = 1,
  CHARACTER SET utf8,
  COLLATE utf8_general_ci;


# ==== Create admin user with default password ==== #
# This user is protected by a trigger and cannot get removed or its username changed.
INSERT INTO user (type, state, email, username, password)
VALUES (
    'admin',
    'activated',
    'admin@vpnaccess.com',
    'admin',
    '$2b$10$w9zB.eyB.gNOfMblxVMcvOo09GFqchJpqZukXKH3R84f1X9YsYDPq' # (???) 'password'
 );

