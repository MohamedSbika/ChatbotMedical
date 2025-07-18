import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const SignUp = () => {
  const [formData, setFormData] = useState({
    name: "",
    familyName: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const navigate = useNavigate();

  const validate = () => {
    const newErrors = {};
    const nameRegex = /^[A-Za-zÀ-ſ\s]+$/;
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;

    if (!nameRegex.test(formData.name)) newErrors.name = "Seulement des lettres";
    if (!nameRegex.test(formData.familyName)) newErrors.familyName = "Seulement des lettres";
    if (!formData.email.includes("@")) newErrors.email = "Email invalide";
    if (!passwordRegex.test(formData.password))
      newErrors.password = "8 caractères avec lettre, chiffre et caractère spécial";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const res = await fetch("http://localhost:5000/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur inconnue");

      navigate("/");
    } catch (err) {
      setServerError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 text-black">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md border border-gray-300"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Créer un compte</h2>

        {serverError && <p className="text-red-500 text-sm mb-4">{serverError}</p>}

        <label className="block mb-4">
          <span className="text-gray-700">Prénom</span>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="mt-1 w-full border border-gray-300 px-4 py-2 rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-gray-300"
            required
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </label>

        <label className="block mb-4">
          <span className="text-gray-700">Nom</span>
          <input
            type="text"
            name="familyName"
            value={formData.familyName}
            onChange={handleChange}
            className="mt-1 w-full border border-gray-300 px-4 py-2 rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-gray-300"
            required
          />
          {errors.familyName && <p className="text-red-500 text-xs mt-1">{errors.familyName}</p>}
        </label>

        <label className="block mb-4">
          <span className="text-gray-700">Email</span>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="mt-1 w-full border border-gray-300 px-4 py-2 rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-gray-300"
            required
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </label>

        <label className="block mb-6">
          <span className="text-gray-700">Mot de passe</span>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="mt-1 w-full border border-gray-300 px-4 py-2 rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-gray-300"
            required
          />
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
        </label>

        <button
          type="submit"
          className="bg-gray-200 hover:bg-gray-300 text-black w-full py-2 rounded-md transition"
        >
          S'inscrire
        </button>

        <p className="text-sm text-center mt-4 text-gray-600">
          Déjà un compte ?{" "}
          <a href="/" className="text-black font-medium hover:underline">Connexion</a>
        </p>
      </form>
    </div>
  );
};

export default SignUp;
