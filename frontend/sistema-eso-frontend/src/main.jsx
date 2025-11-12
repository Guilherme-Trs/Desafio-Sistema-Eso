import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App' // se usar um App central
import Login from './pages/Login'
import Shop from './pages/Shop'
import MyItems from './pages/Myitems'
import Transactions from './pages/Transactions'
import Profile from './pages/Profile'
import Navbar from './components/Navbar'

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Navbar user={null} />
      <Routes>
        <Route path="/" element={<Shop />} />
        <Route path="/login" element={<Login />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/my-items" element={<MyItems />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/profile/:id" element={<Profile />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
