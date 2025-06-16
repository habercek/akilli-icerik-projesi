// pages/admin/index.js
import { useState } from 'react';
import { useRouter } from 'next/router';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import toast, { Toaster } from 'react-hot-toast';

// --- SİMGELER (SVG) ---
const IconRss = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 5c7.73 0 14 6.27 14 14M6 13a7 7 0 017 7m-7-14v0a1 1 0 112 0 1 1 0 01-2 0z" /></svg>;
const IconArticle = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const IconKey = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H5v-2H3v-2H1.258l.017-.006a6 6 0 015.743-7.743z" /></svg>;
const IconGemini = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4m10 4l2 2-2 2m-3-4l-2 2 2 2m7-12l-2 2-2-2m-3 4l2-2-2-2" /></svg>;
const IconMenu = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>;

// --- MODAL BİLEŞENİ ---
function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }) {
    if (!isOpen) return null;
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3>{title}</h3>
                <p>{message}</p>
                <div className="modal-actions">
                    <button onClick={onCancel} className="button-secondary">İptal</button>
                    <button onClick={onConfirm} className="button-danger">Onayla</button>
                </div>
            </div>
        </div>
    );
}

// --- API ANAHTAR YÖNETİM BİLEŞENİ ---
function ApiKeyManager({ title, description, placeholder, type, initialApiKeys = [], onAction, isSubmitting, deletingKey }) {
    const [newApiKey, setNewApiKey] = useState('');
    const [modal, setModal] = useState({ isOpen: false, keyToDelete: null });

    const handleAddSubmit = (e) => {
        e.preventDefault();
        if (!newApiKey.trim()) return;
        onAction('add', type, newApiKey);
        setNewApiKey('');
    };

    const handleDeleteClick = (key) => {
        setModal({ isOpen: true, keyToDelete: key });
    };

    const confirmDelete = () => {
        onAction('delete', type, modal.keyToDelete);
        setModal({ isOpen: false, keyToDelete: null });
    };

    const maskApiKey = (key) => {
        if (!key || key.length < 15) return '********';
        return `********-****-****-****-${key.slice(-15)}`;
    };

    return (
        <div className="
