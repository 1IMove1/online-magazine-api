const Article = require("../models/Article");

module.exports = {
  create: async (req, res) => {
    try {
      if (!req.user.isConfirmed) return res.status(403).json({ error: "Email not confirmed" });
      const { title, content, published } = req.body;
      const article = await Article.create({ title, content, published: !!published, author: req.user._id });
      res.status(201).json(article);
    } catch (err) {
      console.error("Create article error:", err);
      res.status(500).json({ error: "Create failed" });
    }
  },
  list: async (req, res) => {
    try {
      let query = { $or: [{ published: true }] };
      if (req.user) {
        query.$or.push({ author: req.user._id });
      }
      const articles = await Article.find(query).populate("author", "name avatar");
      const articlesWithOwnership = articles.map((article) => {
        const plainArticle = article.toObject();
        plainArticle.isOwner = req.user && article.author._id.equals(req.user._id);
        return plainArticle;
      });
      res.json(articlesWithOwnership);
    } catch (err) {
      console.error("List articles error:", err);
      res.status(500).json({ error: "List failed" });
    }
  },
  get: async (req, res) => {
    try {
      const a = await Article.findById(req.params.id).populate("author", "name avatar");
      if (!a) return res.status(404).json({ error: "Not found" });
      const plain = a.toObject();
      plain.isOwner = req.user && a.author._id.equals(req.user._id);
      res.json(plain);
    } catch (err) {
      console.error("Get article error:", err);
      res.status(500).json({ error: "Get failed" });
    }
  },
  update: async (req, res) => {
    try {
      const a = await Article.findById(req.params.id);
      if (!a) return res.status(404).json({ error: "Not found" });
      if (!a.author.equals(req.user._id)) return res.status(403).json({ error: "Not allowed" });
      const updates = {};
      if (req.body.title) updates.title = req.body.title;
      if (req.body.content) updates.content = req.body.content;
      if (typeof req.body.published !== "undefined") updates.published = !!req.body.published;
      Object.assign(a, updates);
      await a.save();
      res.json(a);
    } catch (err) {
      console.error("Update article error:", err);
      res.status(500).json({ error: "Update failed" });
    }
  },
  remove: async (req, res) => {
    try {
      const article = await Article.findById(req.params.id);
      if (!article) return res.status(404).json({ error: "Not found" });
      if (!article.author.equals(req.user._id)) return res.status(403).json({ error: "Not allowed" });
      await Article.deleteOne({ _id: article._id });
      res.json({ message: "Deleted" });
    } catch (err) {
      console.error("Delete article error:", err);
      res.status(500).json({ error: "Delete failed" });
    }
  },
};
