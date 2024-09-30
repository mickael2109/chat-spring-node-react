import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Create, Login } from './Components/Auth';
import Messenger from './Components/Messenger';
import MessageInterface from './Components/MessageInterface';

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/create" element={<Create />} />
        <Route path="/listuser" element={<Messenger />} />
        <Route path="/message/:id" element={<MessageInterface />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
