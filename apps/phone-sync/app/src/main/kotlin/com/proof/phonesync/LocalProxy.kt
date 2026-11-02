package com.proof.phonesync

import java.io.InputStream
import java.io.OutputStream
import java.net.InetAddress
import java.net.InetSocketAddress
import java.net.ServerSocket
import java.net.Socket
import kotlin.concurrent.thread

/**
 * Forwards 127.0.0.1:<port> on the phone to the laptop over Wi-Fi. The desk then loads from a localhost
 * origin, which the WebView treats as secure, so the live camera (getUserMedia) works without HTTPS.
 */
class LocalProxy(private val host: String, private val port: Int) {
    private var server: ServerSocket? = null

    /** Listens on [preferred] so the page origin (and its saved storage) stays the same; any free port otherwise. */
    fun start(preferred: Int): Int {
        val loopback = InetAddress.getByName("127.0.0.1")
        val socket = try {
            ServerSocket(preferred, 64, loopback)
        } catch (_: Exception) {
            ServerSocket(0, 64, loopback)
        }
        server = socket
        thread(isDaemon = true, name = "worthit-proxy") {
            while (!socket.isClosed) {
                val client = try {
                    socket.accept()
                } catch (_: Exception) {
                    break
                }
                thread(isDaemon = true, name = "worthit-proxy-conn") { bridge(client) }
            }
        }
        return socket.localPort
    }

    fun stop() {
        runCatching { server?.close() }
        server = null
    }

    private fun bridge(client: Socket) {
        val upstream = Socket()
        try {
            upstream.connect(InetSocketAddress(host, port), 5000)
            upstream.tcpNoDelay = true
            client.tcpNoDelay = true
            val back = thread(isDaemon = true, name = "worthit-proxy-down") {
                pump(upstream.getInputStream(), client.getOutputStream())
                runCatching { client.shutdownOutput() }
            }
            pump(client.getInputStream(), upstream.getOutputStream())
            runCatching { upstream.shutdownOutput() }
            back.join()
        } catch (_: Exception) {
        } finally {
            runCatching { upstream.close() }
            runCatching { client.close() }
        }
    }

    private fun pump(input: InputStream, output: OutputStream) {
        val buffer = ByteArray(32 * 1024)
        try {
            while (true) {
                val read = input.read(buffer)
                if (read < 0) break
                output.write(buffer, 0, read)
                output.flush()
            }
        } catch (_: Exception) {
        }
    }
}
