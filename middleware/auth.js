const request = require('supertest');
const jwt = require('jsonwebtoken');
const express = require('express');
const mongoose = require('mongoose');
const { protect } = require('../middleware/auth');
const User = require('../models/User');

const app = express();
app.use(express.json());

// Simuler une route protégée
app.get('/protected', protect, (req, res) => {
    res.json({ message: 'Accès autorisé', user: req.user });
});

// Mock du modèle User
jest.mock('../models/User', () => ({
    findById: jest.fn(),
}));

describe('Middleware Auth', () => {
    let token;
    const userId = new mongoose.Types.ObjectId();

    beforeEach(() => {
        token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
    });

    it('✅ Devrait autoriser l\'accès avec un token valide', async () => {
        User.findById.mockResolvedValue({ _id: userId, name: 'Test User', email: 'test@example.com' });

        const res = await request(app)
            .get('/protected')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Accès autorisé');
        expect(res.body.user).toHaveProperty('_id');
    });

    it('🚫 Devrait refuser l\'accès sans token', async () => {
        const res = await request(app).get('/protected');

        expect(res.status).toBe(401);
        expect(res.body.message).toBe('Non autorisé, pas de token');
    });

    it('🚫 Devrait refuser l\'accès avec un token invalide', async () => {
        const res = await request(app)
            .get('/protected')
            .set('Authorization', 'Bearer invalid_token');

        expect(res.status).toBe(401);
        expect(res.body.message).toBe('Non autorisé, token invalide');
    });

    it('🚫 Devrait refuser l\'accès si l\'utilisateur n\'existe pas', async () => {
        User.findById.mockResolvedValue(null);

        const res = await request(app)
            .get('/protected')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(401);
        expect(res.body.message).toBe('Non autorisé, utilisateur introuvable');
    });
});
