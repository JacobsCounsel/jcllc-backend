// communication-hub.js - Enhanced Backend Communication System
import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';

class CommunicationHub {
    constructor(app) {
        this.app = app;
        this.server = createServer(app);
        this.io = new Server(this.server, {
            cors: {
                origin: "https://jacobscounsellaw.com",
                methods: ["GET", "POST"]
            }
        });
        
        this.setupSocketHandlers();
        this.setupRestEndpoints();
    }
    
    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            console.log('Client connected:', socket.id);
            
            // Real-time form progress tracking
            socket.on('form:progress', (data) => {
                console.log('Form progress:', data);
                this.trackFormProgress(socket.id, data);
            });
            
            // Live chat support
            socket.on('chat:message', async (data) => {
                const response = await this.handleChatMessage(data);
                socket.emit('chat:response', response);
            });
            
            // Real-time notifications
            socket.on('subscribe:updates', (clientEmail) => {
                socket.join(`client:${clientEmail}`);
            });
            
            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
            });
        });
    }
    
    setupRestEndpoints() {
        // Enhanced status endpoint with detailed info
        this.app.get('/api/status', (req, res) => {
            res.json({
                status: 'operational',
                timestamp: new Date().toISOString(),
                services: {
                    openai: this.checkOpenAI(),
                    mailchimp: this.checkMailchimp(),
                    clio: this.checkClio(),
                    motion: this.checkMotion(),
                    email: this.checkEmail()
                },
                stats: {
                    activeConnections: this.io.sockets.sockets.size,
                    todaySubmissions: this.getTodayStats()
                }
            });
        });
        
        // Smart notification system
        this.app.post('/api/notify', async (req, res) => {
            const { clientEmail, message, type } = req.body;
            
            // Send real-time notification if client is online
            this.io.to(`client:${clientEmail}`).emit('notification', {
                message,
                type,
                timestamp: new Date().toISOString()
            });
            
            // Also send email
            await this.sendNotificationEmail(clientEmail, message, type);
            
            res.json({ success: true });
        });
    }
    
    async handleChatMessage(data) {
        const { message, context } = data;
        
        // Use OpenAI to generate response
        const aiResponse = await this.generateAIResponse(message, context);
        
        // Log for analytics
        await this.logChatInteraction(data, aiResponse);
        
        return {
            response: aiResponse,
            timestamp: new Date().toISOString(),
            suggestions: await this.generateSuggestions(context)
        };
    }
    
    async generateAIResponse(message, context) {
        // OpenAI integration
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: `You are a helpful legal assistant for Jacobs Counsel. 
                                 Be professional, friendly, and concise. 
                                 Context: ${JSON.stringify(context)}`
                    },
                    {
                        role: 'user',
                        content: message
                    }
                ],
                max_tokens: 200
            })
        });
        
        const data = await response.json();
        return data.choices[0].message.content;
    }
    
    // Service health checks
    checkOpenAI() {
        return !!process.env.OPENAI_API_KEY ? 'active' : 'not configured';
    }
    
    checkMailchimp() {
        return !!process.env.MAILCHIMP_API_KEY ? 'active' : 'not configured';
    }
    
    checkClio() {
        return !!process.env.CLIO_GROW_INBOX_TOKEN ? 'active' : 'not configured';
    }
    
    checkMotion() {
        return !!process.env.MOTION_API_KEY ? 'active' : 'not configured';
    }
    
    checkEmail() {
        return !!process.env.MS_CLIENT_ID ? 'active' : 'not configured';
    }
}

export default CommunicationHub;
