// pages/api/add-api-key.js

import { db } from '../../firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { key } = req.body;

    if (!key) {
      return res.status(400).json({ error: 'API anahtarı boş olamaz.' });
    }

    const siteRef = doc(db, 'sites', 'test-sitesi');

    // "deepl_keys" dizisine yeni anahtarı ekle
    await updateDoc(siteRef, {
      deepl_keys: arrayUnion(key)
    });

    res.status(200).json({ message: 'API anahtarı başarıyla eklendi.' });

  } catch (error) {
    console.error('API Anahtarı Ekleme Hatası:', error);
    res.status(500).json({ error: 'Sunucuda bir hata oluştu.' });
  }
}
