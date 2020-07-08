# ==== Protects the admin user from getting removed ==== #
DROP TRIGGER IF EXISTS openvpn_access.AdminProtectionDelete;
CREATE DEFINER = 'root'@'localhost'
TRIGGER openvpn_access.AdminProtectionDelete
	BEFORE DELETE
	ON openvpn_access.user
	FOR EACH ROW
BEGIN

IF (old.username = 'admin')
  THEN signal sqlstate '45000' set message_text = 'Cannot remove admin user';
END IF;

END;

# ==== Protects the admin username ==== #
DROP TRIGGER IF EXISTS openvpn_access.AdminProtectionUpdate;
CREATE DEFINER = 'root'@'localhost'
TRIGGER openvpn_access.AdminProtectionUpdate
	BEFORE UPDATE
	ON openvpn_access.user
	FOR EACH ROW
BEGIN

IF (old.username = 'admin' AND new.username != 'admin')
  THEN signal sqlstate '45000' set message_text = 'Cannot change admin user';
END IF;

END;
