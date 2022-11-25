import { useCallback, useEffect, useState } from "react";
import "quill/dist/quill.snow.css";
import Quill from "quill";
import { io } from "socket.io-client";
import { useParams } from "react-router-dom";

const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ font: [] }],
  [{ list: "ordered" }, { list: "bullet" }],
  ["bold", "italic", "underline"],
  [{ color: [] }, { background: [] }],
  [{ align: [] }],
  ["image", "blockquote", "code-block"],
  ["clean"],
];
export const TextEditor = () => {
  const [socket, setSocket] = useState();
  const [quil, setQuill] = useState();

  const { id: documentId } = useParams();

  useEffect(() => {
    const sio = io("http://127.0.0.1:3002");
    setSocket(sio);
    return () => {
      sio.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket || !quil) return;
    
    socket.once("load-document", (document) => {
      quil.setContents(document);
      quil.enable(); //enabling the document after it has been sent from the server. Till then the editor will remain disabled
    });

    socket.emit("get-document", documentId);
  }, [socket, quil, documentId]);

  useEffect(() => {
    if (!quil || !socket) return;
    const handler = (delta, oldDelta, source) => {
      if (source !== "user") return;
      // emitting events if user is making the changes
      socket.emit("send-changes", delta);
    };

    quil.on("text-change", handler);

    return () => {
      quil.off("text-change", handler);
    };
  }, [socket, quil]);

  useEffect(() => {
    if (!quil || !socket) return;
    const handler = (delta) => {
      quil.updateContents(delta);
    };

    // quil.on("text-change",handler)
    socket.on("receive-changes", handler);

    return () => {
      socket.off("receive-changes", handler);
    };
  }, [socket, quil]);

  
  // saving the document
  useEffect(() => {
    if(!socket || !quil) return
    const interval = setInterval(()=>{
        socket.emit("save-document",quil.getContents())
    },200)
 
    return()=>{
        clearInterval(interval)
    }
  }, [socket,quil])
  
  // here wrapperRef is basically a function which is getting called after the element is rendered and then it calls the function
  // ref passes the elementReference automatically so wrapper argument is used
  // if not passed then return nothing
  const wrapperRef = useCallback((wrapper) => {
    if (wrapper === null) return;

    const editor = document.createElement("div");
    wrapper.append(editor);
    const q = new Quill(editor, {
      theme: "snow",
      modules: {
        toolbar: TOOLBAR_OPTIONS,
      },
    });
    q.disable()
    q.setText("Loading.....")
    setQuill(q);
  }, []);

  return <div id="container" ref={wrapperRef}></div>;
};
