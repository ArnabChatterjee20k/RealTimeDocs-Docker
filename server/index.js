const mongoose = require("mongoose");
const Document = require("./Document");

const defaultValue = "";

mongoose.connect("mongodb://localhost/docs", {
  useNewUrlParser: true,
  user: "root",
  pass: "root",
  authSource: "admin",
});

const db = mongoose.connection;
db.on("error", () => {
  console.error("Error");
});

db.once("open", () => {
  console.log("connected");
});
const io = require("socket.io")(3002, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  socket.on("get-document", async (documentId) => {
    const document = await findOrCreateDocument(documentId);
    const data = document.data
    socket.join(documentId);
    socket.emit("load-document", data);

    // nested the event inside this event so that document id is also accessible
    socket.on("send-changes", (delta) => {
      socket.broadcast.to(documentId).emit("receive-changes", delta); // sending data to a particular room
    });

    socket.on("save-document", async (data) => {
      await Document.findByIdAndUpdate(documentId, { data });
    });
  });
});

async function findOrCreateDocument(id) {
  const document = await Document.findById(id);
  if (document) return document;
  const doc = await Document.create({ _id: id, data: defaultValue });
  return doc;
}
