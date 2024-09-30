import React, { useEffect, useState } from 'react';
import { FaChevronCircleLeft, FaPhone, FaRegPaperPlane, FaVideo } from 'react-icons/fa';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import io from 'socket.io-client';

const socket = io('http://localhost:5050');

const MessageInterface = () => {
  const token = Cookies.get('token');
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const idUserReceiver = useParams()
  const [userReceiver, setUserReceiver] = useState({
    usernameReceiver:'', profileReceiver:'', status: ''
  })
  const [user, setUser] = useState({
    username:'', id:"", profile:''
})

  useEffect(() => {

    // get info user receiver
    const getInfoUserReceiver = async () => {
        try {
            const rep = await axios.get(`http://localhost:5050/getinfouser/${idUserReceiver.id}`);
            setUserReceiver((prevItem) => ({
                ...prevItem,
                usernameReceiver: rep.data.data.username,
                profileReceiver: `https://i.pravatar.cc/150?img=${rep.data.data.id}`,
                status: rep.data.data.status
            }));

        } catch (error) {
            console.error(error);
        }
    };
    getInfoUserReceiver()

    // get user info
    const getInfoUser = async () => {
        try {
            const rep = await axios.post('http://localhost:5050/getinfouser', {
                token,
            });
            setUser((prevItem) => ({
                ...prevItem,
                username: rep.data.data.username,
                id: rep.data.data.user,
                profile: `https://i.pravatar.cc/150?img=${rep.data.data.user}`
            }));

        } catch (error) {
            console.error(error);
        }
      };
    getInfoUser()

    // get message user
    const getMessageUser = async() => {
      try {
        const rep =  await axios.post(`http://localhost:5050/mymessage/${idUserReceiver.id}`, 
          { "token": token }
        )
        setMessages(rep.data)

      } catch (error) {
          console.error(error);
      }
    }
    getMessageUser()
   
  },[])



  useEffect(() => {

    socket.on('new_message', (msg) => {
      // console.log(msg.rows[0].receiver_id ,'===', user.id.toString() ,'&&', msg.rows[0].sender_id ,'===', idUserReceiver.id.toString());
      if  (
            (msg.rows[0].receiver_id === user.id.toString() && msg.rows[0].sender_id === idUserReceiver.id.toString()) ||
            (msg.rows[0].receiver_id === idUserReceiver.id.toString() && msg.rows[0].sender_id === user.id.toString())
          ) {
            
        setMessages(prevMessages => [...prevMessages, msg.rows[0]]);
      }
    });
    return () => socket.off('new_message');

  },[user])



  const sendMessage = async () => {
    try {
        await axios.post('http://localhost:5050/sendmessage', {
            token,
            content: message,
            receiverId : idUserReceiver.id,
        });
        setMessage('');
    } catch (error) {
        alert('Failed to send message');
    }
  };



  return (
   <div className='flex flex-col justify-center items-center h-screen'>
        <div className="flex flex-col h-[90vh] bg-[#101010dc] rounded-lg p-4 w-[500px] text-white">
            {/* HEADER */}
            <div className='flex flex-row justify-between items-center border-b border-gray-600 pb-2'>
               <div className='flex flex-row justify-start gap-3 items-center'>
                    <div><Link to="/listuser"><i className='text-[#783CEF]'><FaChevronCircleLeft/></i></Link></div>
                    <div><img src={userReceiver.profileReceiver}  alt="img" className="w-12 h-12 rounded-full"/></div>
                    <div>
                        <div className='text-[12px] font-bold'>{userReceiver.usernameReceiver}</div>
                        <div className='text-[10px] text-gray-500'>{userReceiver.status ? 'En ligne' : 'Hors ligne'}</div>
                    </div>
               </div>
               <div className='flex flex-row justify-start gap-3 items-center text-[25px]'>
                    <i className='text-[#783CEF]'><FaPhone/></i>
                    <i className='text-[#783CEF]'><FaVideo/></i>
               </div>
            </div>

            {/* Message list */}
            <div className="flex-1 p-4 overflow-y-auto">
                {messages.map((msg) => (
                <div
                    key={msg.id}
                    className={`flex gap-2 ${
                    msg.receiver_id === idUserReceiver.id ? 'justify-end' : 'justify-start'
                    } mb-4`}
                >
                    <div className={`${msg.receiver_id === idUserReceiver.id ? ` hidden` : ` block`}`}><img src={`${userReceiver.profileReceiver}`}  alt="" className={`w-8 h-8 rounded-full`}/></div>
                    <div className='flex flex-col justify-start gap-0'>
                      <div
                      className={`w-[200px] text-[12px] px-4 py-2 rounded-lg ${
                        msg.receiver_id === idUserReceiver.id ? 'bg-[#2563EB] text-white' : 'bg-gray-300 text-gray-900'
                      }`}
                      >
                      {msg.content}
                      </div>
                      <div className='mt-[-8px] ml-3'><span className='text-gray-400 text-[8px]'>07:30</span></div>
                    </div>
                    
                </div>
                ))}
            </div>

            {/* Message input */}
            <div className="flex items-center p-2 bg-transparent border-t border-gray-600">
                <input
                type="text"
                placeholder="Tapez votre message..."
                className="flex-1 px-4 py-2 border border-gray-600 bg-gray-500 text-[12px] rounded-lg focus:outline-none focus:ring focus:ring-blue-500"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                />

                <button
                onClick={sendMessage}
                className="ml-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none"
                >
                <i><FaRegPaperPlane/></i>
                </button>
            </div>
        </div>
   </div>
  );
};

export default MessageInterface;
