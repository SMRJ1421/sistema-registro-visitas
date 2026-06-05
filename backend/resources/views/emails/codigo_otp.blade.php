<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Código de Verificación</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f9; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); overflow: hidden;">
        <tr>
            <td style="background-color: #BF0909; padding: 15px; text-align: center;">
                <span style="color: #ffffff; font-size: 18px; font-weight: bold; letter-spacing: 1px;">SISTEMA DE REGISTRO DE VISITAS</span>
            </td>
        </tr>
        <tr>
            <td style="padding: 40px 30px; text-align: center;">
                <h2 style="color: #1a202c; margin-bottom: 10px; font-size: 22px;">Autenticación de Doble Factor (2FA)</h2>
                <p style="color: #4a5568; font-size: 15px; line-height: 1.6; margin-bottom: 30px;">
                    Se ha solicitado un acceso al entorno administrativo. Utiliza el siguiente código único para completar tu inicio de sesión:
                </p>
                
                <div style="background-color: #fff5f5; border: 2px dashed #BF0909; border-radius: 6px; padding: 15px; display: inline-block; margin-bottom: 30px;">
                    <span style="font-size: 32px; font-weight: bold; color: #BF0909; letter-spacing: 6px; font-family: monospace;">{{ $codigo }}</span>
                </div>
                
                <p style="color: #718096; font-size: 13px; line-height: 1.5;">
                    Este código es confidencial y válido únicamente por los próximos <b>5 minutos</b>.<br>
                    Si tú no has solicitado este acceso, ignora este mensaje de seguridad.
                </p>
            </td>
        </tr>
        <tr>
            <td style="background-color: #f7fafc; padding: 20px; text-align: center; border-top: 1px solid #edf2f7;">
                <p style="color: #a0aec0; font-size: 11px; margin: 0;">Reporte Oficial de Control de Accesos - Trazabilidad bajo Normativa PCM</p>
            </td>
        </tr>
    </table>
</body>
</html>