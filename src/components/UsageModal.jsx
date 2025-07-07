import { collection, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../firebase';

const UsageModal = ({ isOpen, onClose, onSubmit, item }) => {
    // State'ler
    const [hospital, setHospital] = useState('');
    const [patientName, setPatientName] = useState('');
    const [patientTC, setPatientTC] = useState('');
    const [usageDate, setUsageDate] = useState(new Date().toISOString().split('T')[0]);
    const [billingType, setBillingType] = useState('DMO');
    const [isDealerInvolved, setIsDealerInvolved] = useState(false);
    const [involvedDealerId, setInvolvedDealerId] = useState('');
    const [dealers, setDealers] = useState([]);
    const [invoiceRecipient, setInvoiceRecipient] = useState('Doğrudan Hastaneye');

    useEffect(() => {
        const fetchDealers = async () => {
            const dealersCollection = await getDocs(collection(db, "dealers"));
            setDealers(dealersCollection.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        };
        if (isOpen) {
            fetchDealers();
        }
    }, [isOpen]);

    const handlePatientNameChange = (e) => {
        const value = e.target.value;
        if (/^[a-zA-Z\sğüşıöçĞÜŞİÖÇ]*$/.test(value)) {
            setPatientName(value);
        }
    };

    const handlePatientTCChange = (e) => {
        const value = e.target.value;
        if (/^\d{0,11}$/.test(value)) {
            setPatientTC(value);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (patientTC.length > 0 && patientTC.length !== 11) {
            alert("T.C. Kimlik Numarası 11 haneli olmalıdır.");
            return;
        }
        if (!hospital || !patientName || !usageDate || !billingType || (isDealerInvolved && !involvedDealerId)) {
            alert("Lütfen tüm zorunlu alanları doldurun.");
            return;
        }
        const selectedDealer = dealers.find(d => d.id === involvedDealerId);
        onSubmit({
            hospital,
            patient: `Ad Soyad: ${patientName}, T.C.: ${patientTC}`,
            usageDate,
            billingType,
            isDealerInvolved,
            involvedDealer: isDealerInvolved ? { id: selectedDealer.id, name: selectedDealer.name } : null,
            invoiceRecipient: isDealerInvolved ? invoiceRecipient : null
        });
    };

    if (!isOpen) return null;

    const inputStyle = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg shadow-xl z-50 w-full max-w-lg">
                <h2 className="text-xl font-bold mb-4">Kullanım Bilgilerini Girin</h2>
                <form id="usageForm" onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    {/* Tüm Form Alanları */}
                    <div>
                        <label htmlFor="hospital" className="block text-sm font-medium text-gray-700">Hastane</label>
                        <input type="text" id="hospital" value={hospital} onChange={(e) => setHospital(e.target.value)} className={inputStyle} required />
                    </div>
                    <div>
                        <label htmlFor="patientName" className="block text-sm font-medium text-gray-700">Hasta Adı Soyadı</label>
                        <input type="text" id="patientName" value={patientName} onChange={handlePatientNameChange} className={inputStyle} required />
                    </div>
                    <div>
                        <label htmlFor="patientTC" className="block text-sm font-medium text-gray-700">Hasta T.C. Kimlik No</label>
                        <input type="text" id="patientTC" value={patientTC} onChange={handlePatientTCChange} maxLength="11" className={inputStyle} />
                    </div>
                    <div>
                        <label htmlFor="usageDate" className="block text-sm font-medium text-gray-700">Kullanım Tarihi</label>
                        <input type="date" id="usageDate" value={usageDate} onChange={(e) => setUsageDate(e.target.value)} className={inputStyle} required />
                    </div>
                    <hr className="my-4"/>
                    <h3 className="text-lg font-semibold">Fatura ve Bayi Bilgileri</h3>
                    <div>
                        <label htmlFor="billingType" className="block text-sm font-medium text-gray-700">Fatura Tipi</label>
                        <select id="billingType" value={billingType} onChange={(e) => setBillingType(e.target.value)} className={inputStyle}>
                            <option value="DMO">DMO</option>
                            <option value="Hasta Başı">Hasta Başı</option>
                            <option value="Özel Hastane">Özel Hastane</option>
                        </select>
                    </div>
                    <div className="flex items-center mt-4">
                        <input type="checkbox" id="isDealerInvolved" checked={isDealerInvolved} onChange={(e) => setIsDealerInvolved(e.target.checked)} className="h-4 w-4 rounded" />
                        <label htmlFor="isDealerInvolved" className="ml-2 block text-sm text-gray-900">Bu işleme bir bayi dahil mi?</label>
                    </div>
                    {isDealerInvolved && (
                        <div className="space-y-4 p-4 border-l-4 border-blue-500 bg-blue-50">
                            <div>
                                <label htmlFor="involvedDealerId" className="block text-sm font-medium text-gray-700">İlişkili Bayi</label>
                                <select id="involvedDealerId" value={involvedDealerId} onChange={(e) => setInvolvedDealerId(e.target.value)} className={inputStyle} required={isDealerInvolved}>
                                    <option value="">-- Bayi Seçin --</option>
                                    {dealers.map(d => <option key={d.id} value={d.id}>{d.name} ({d.city})</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="invoiceRecipient" className="block text-sm font-medium text-gray-700">Fatura Kime Kesilecek?</label>
                                <select id="invoiceRecipient" value={invoiceRecipient} onChange={(e) => setInvoiceRecipient(e.target.value)} className={inputStyle}>
                                    <option value="Doğrudan Hastaneye">Doğrudan Hastaneye (Komisyonlu)</option>
                                    <option value="Doğrudan Bayiye">Doğrudan Bayiye</option>
                                </select>
                            </div>
                        </div>
                    )}
                </form>
                <div className="mt-6 flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded">İptal</button>
                    <button type="submit" form="usageForm" className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">Kaydet</button>
                </div>
            </div>
        </div>
    );
};

export default UsageModal;