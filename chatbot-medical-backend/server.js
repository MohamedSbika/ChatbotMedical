const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const removeAccents = require("remove-accents");

const app = express();
app.use(cors());
app.use(express.json());

// Connexion MongoDB
mongoose
  .connect("mongodb://localhost:27017/chatbot", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connecté"))
  .catch((err) => console.error("❌ Erreur MongoDB :", err));

// Modèle Mongoose
const FaqSchema = new mongoose.Schema({
  question: String,
  answer: String,
});
const Faq = mongoose.model("Faq", FaqSchema);

// 🔁 Route pour ajouter une question/réponse
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

// 🔍 Route pour poser une question
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

// Serveur
app.listen(5000, () =>
  console.log("🚀 Serveur en écoute sur http://localhost:5000")
);
