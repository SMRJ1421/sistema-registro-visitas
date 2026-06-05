<?php
$dsn = "pgsql:host=127.0.0.1;port=5432;dbname=reniec_asistencia";
$user = "postgres";
$pass = "postgres";
try {
    $pdo = new PDO($dsn, $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $pdo->exec(<<<'SQL'
CREATE TABLE IF NOT EXISTS usuario_sistema (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(200) NOT NULL,
  nombre_completo VARCHAR(200) NOT NULL,
  rol VARCHAR(50) NOT NULL DEFAULT 'Usuario',
  estado BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
SQL
    );

    $hash = '$2y$10$zzng79.g6oGYC.bi7zLLi.FfPtqD3jegeUCkJThPgI9hskIjFxG5y';

    $check = $pdo->prepare("SELECT id FROM usuario_sistema WHERE username = ? LIMIT 1");
    $check->execute(['admin']);
    $row = $check->fetch(PDO::FETCH_ASSOC);

    if ($row) {
        $stmt = $pdo->prepare("UPDATE usuario_sistema SET password = ?, nombre_completo = ?, rol = ?, estado = ?, updated_at = now() WHERE username = ?");
        $stmt->execute([$hash, 'Administrador Principal', 'Administrador', true, 'admin']);
        echo "OK: admin updated\n";
    } else {
        $stmt = $pdo->prepare("INSERT INTO usuario_sistema (username, password, nombre_completo, rol, estado) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute(['admin', $hash, 'Administrador Principal', 'Administrador', true]);
        echo "OK: admin inserted\n";
    }
} catch (Exception $e) {
    echo "ERR: " . $e->getMessage() . "\n";
}
?>