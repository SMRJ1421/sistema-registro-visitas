<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CodigoVerificacionMail extends Mailable
{
    use Queueable, SerializesModels;

    // Propiedad pública que contendrá el código OTP de 6 dígitos
    public $codigo;

    /**
     * Create a new message instance.
     * Recibe el código dinámico generado en el controlador de autenticación.
     */
    public function __construct($codigo)
    {
        $this->codigo = $codigo;
    }

    /**
     * Get the message envelope.
     * Configura el encabezado y el asunto formal del correo institucional.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Código de Seguridad - Sistema de Registro de Visitas',
        );
    }

    /**
     * Get the message content definition.
     * Define la plantilla Blade (HTML) encargada de estructurar el cuerpo del correo.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.codigo_otp',
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}