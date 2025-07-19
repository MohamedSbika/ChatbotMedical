require('dotenv').config({ path: '../.env' }); // Charger .env situé au-dessus du dossier backend

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const removeAccents = require("remove-accents");
const bcrypt = require("bcryptjs");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const User = require("./models/User"); // Assure-toi que le modèle User est bien défini
const RefreshToken = require("./models/RefreshToken"); // import du modèle refresh token
const verifyToken = require("./middleware/verifyToken");
const Conversation = require("./models/Conversation");

const app = express();

app.use(cors());
app.use(express.json());

// Connexion MongoDB
mongoose
    .connect(process.env.MONGO_URI || "mongodb://localhost:27017/chatbot", {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log("✅ MongoDB connecté"))
    .catch((err) => console.error("❌ Erreur MongoDB :", err));

// MODELE FAQ
const FaqSchema = new mongoose.Schema({
    question: String,
    answer: String,
});
const Faq = mongoose.model("Faq", FaqSchema);

// ROUTE AJOUT FAQ
app.post("/api/faq", async (req, res) => {
    try {
        const { question, answer } = req.body;
        const newFaq = new Faq({ question, answer });
        await newFaq.save();
        res.status(201).json({ message: "Ajouté avec succès", faq: newFaq });
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error });
    }
});

// ROUTE QUESTION CHATBOT
app.post("/api/ask", async (req, res) => {
    try {
        const userQuestion = removeAccents(req.body.question?.toLowerCase().trim());
        const faqs = await Faq.find();

        const match = faqs.find((faq) => {
            const dbQuestion = removeAccents(faq.question.toLowerCase().trim());
            return dbQuestion === userQuestion;
        });

        if (match) {
            res.json({ answer: match.answer });
        } else {
            res.json({ answer: "Désolé, je n'ai pas de réponse à cela." });
        }
    } catch (error) {
        console.error("Erreur dans /api/ask :", error.message);
        res.status(500).json({ message: "Erreur serveur" });
    }
});

// ROUTE SIGNUP UTILISATEUR
app.post("/api/signup", async (req, res) => {
    const { name, familyName, email, password } = req.body;

    if (!name || !familyName || !email || !password) {
        return res.status(400).json({ message: "Tous les champs sont requis." });
    }

    const nameRegex = /^[A-Za-zÀ-ÿ\s]+$/;
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!nameRegex.test(name) || !nameRegex.test(familyName)) {
        return res.status(400).json({
            message: "Nom et prénom doivent contenir uniquement des lettres.",
        });
    }

    if (!validator.isEmail(email)) {
        return res.status(400).json({ message: "Adresse email invalide." });
    }

    if (!passwordRegex.test(password)) {
        return res.status(400).json({
            message:
                "Le mot de passe doit contenir au moins 8 caractères, avec lettres, chiffres et caractère spécial.",
        });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: "Cet email est déjà utilisé." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            name,
            familyName,
            email,
            password: hashedPassword,
        });

        await newUser.save();

        res.status(201).json({ message: "Inscription réussie" });
    } catch (error) {
        console.error("Erreur serveur signup:", error.message);
        res.status(500).json({ message: "Erreur serveur" });
    }
});

// ROUTE LOGIN UTILISATEUR AVEC JWT
app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email et mot de passe requis." });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ message: "Identifiants incorrects." });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: "Identifiants incorrects." });

        // Création du token d'accès (courte durée)
        const accessToken = jwt.sign(
            { id: user._id, email: user.email, name: user.name, familyName: user.familyName },  // ajoute name et familyName
            process.env.JWT_SECRET,
            { expiresIn: "15m" }
        );


        // Création du refresh token (plus longue durée)
        const refreshToken = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_REFRESH_SECRET,  // clef spécifique pour refresh token
            { expiresIn: "7d" }  // 7 jours
        );

        // Sauvegarder le refresh token en base
        const newRefreshToken = new RefreshToken({
            token: refreshToken,
            userId: user._id,
        });
        await newRefreshToken.save();

        // Envoyer les tokens au client
        res.json({ accessToken, refreshToken, message: "Connexion réussie" });
    } catch (error) {
        console.error("Erreur serveur login:", error.message);
        res.status(500).json({ message: "Erreur serveur" });
    }
});

app.post("/api/logout", async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({ message: "Refresh token manquant." });
    }

    try {
        // Supprimer le token de la base
        await RefreshToken.findOneAndDelete({ token: refreshToken });
        res.status(200).json({ message: "Déconnexion réussie." });
    } catch (error) {
        console.error("Erreur logout:", error.message);
        res.status(500).json({ message: "Erreur serveur lors du logout." });
    }
});


// 🟢 Créer une nouvelle conversation
app.post("/api/conversations", verifyToken, async (req, res) => {
    try {
        const newConversation = new Conversation({ userId: req.user.id, messages: [] });
        await newConversation.save();
        res.status(201).json(newConversation);
    } catch (error) {
        console.error("Erreur création conversation :", error.message);
        res.status(500).json({ message: "Erreur serveur" });
    }
});

// 🟡 Ajouter un message à une conversation existante
app.post("/api/conversations/:id/message", verifyToken, async (req, res) => {
    try {
        const conversation = await Conversation.findById(req.params.id);
        if (!conversation) return res.status(404).json({ message: "Conversation non trouvée." });

        if (conversation.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Accès interdit à cette conversation." });
        }

        const newMessage = {
            sender: req.body.sender || "user",
            text: req.body.text,
        };

        conversation.messages.push(newMessage);
        await conversation.save();

        res.status(200).json(conversation);
    } catch (error) {
        console.error("Erreur ajout message :", error.message);
        res.status(500).json({ message: "Erreur serveur" });
    }
});

// 🔵 Récupérer toutes les conversations d’un utilisateur
app.get("/api/conversations", verifyToken, async (req, res) => {
    try {
        const conversations = await Conversation.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json(conversations);
    } catch (error) {
        console.error("Erreur récupération conversations :", error.message);
        res.status(500).json({ message: "Erreur serveur" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Serveur en écoute sur http://localhost:${PORT}`);
});
