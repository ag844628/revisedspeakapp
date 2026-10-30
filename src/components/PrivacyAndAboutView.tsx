import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Database, 
  Trash2, 
  Download, 
  Eye, 
  Info, 
  Sliders, 
  CheckCircle2, 
  ExternalLink,
  Smartphone,
  Sparkles
} from 'lucide-react';

interface PrivacyAndAboutViewProps {
  onClearAllData: () => void;
  onExportData: () => void;
  onOpenPermissions: () => void;
}

export const PrivacyAndAboutView: React.FC<PrivacyAndAboutViewProps> = ({
  onClearAllData,
  onExportData,
  onOpenPermissions,
}) => {
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  return (
    <div className="space-y-6 pb-14 animate-in fade-in duration-200">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white p-5 rounded-3xl shadow-lg border border-purple-800/40">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-purple-600/30 rounded-2xl backdrop-blur-xs border border-purple-400/30">
            <ShieldCheck className="w-6 h-6 text-purple-300" />
          </div>
          <div>
            <h2 className="text-lg font-bold">अ‍ॅप माहिती, प्रायव्हसी व नियंत्रण (Privacy & Controls)</h2>
            <p className="text-xs text-purple-200 mt-0.5">
              तुमचा डेटा, प्रायव्हसी आणि थर्ड-पार्टी नियंत्रणाविषयी संपूर्ण पारदर्शकता.
            </p>
          </div>
        </div>
      </div>

      {/* 1. About the App (अ‍ॅप बद्दल माहिती) */}
      <section className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Info className="w-4 h-4 text-purple-700" />
          <span>हे ऍप काय आहे आणि कसे कार्य करते? (About Companion AI)</span>
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          <strong>Companion (NewspeakApp)</strong> हे मराठी भाषेतील प्रगत AI व्हॉईस असिस्टंट आणि पर्सनलाइझ्ड डिजिटल साथीदार आहे. हे ॲप गुगलच्या <strong>Gemini 3.8 Flash</strong> कृत्रिम बुद्धिमत्ता तंत्रज्ञानाचा आणि वेब ऑडिओ इंजिनचा वापर करून माणसासारखे जिव्हाळ्याचे संभाषण करते.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <div className="bg-purple-50/60 p-3 rounded-2xl border border-purple-100">
            <span className="text-xs font-bold text-purple-950 block">👥 वैयक्तिक प्रोफाइल्स</span>
            <span className="text-[11px] text-slate-600">आई, मित्र, आजी यांच्यासारखा चेहरा, वय व नाते ठरवून प्रत्यक्ष व्यक्तीप्रमाणे गप्पा मारा.</span>
          </div>
          <div className="bg-indigo-50/60 p-3 rounded-2xl border border-indigo-100">
            <span className="text-xs font-bold text-indigo-950 block">🎙️ व्हॉईस क्लोनिंग क्षमता</span>
            <span className="text-[11px] text-slate-600">कोणतीही ऑडिओ क्लिप टाकून त्या आवाजाची फ्रिक्वेन्सी व पिच क्लोन करून त्या आवाजात संवाद साधा.</span>
          </div>
          <div className="bg-amber-50/60 p-3 rounded-2xl border border-amber-100">
            <span className="text-xs font-bold text-amber-950 block">⚡ मोबाईल टास्क नियंत्रण</span>
            <span className="text-[11px] text-slate-600">टॉर्च, अलार्म, टायमर्स, नोट्स, कॉल, ब्राईटनेस आणि आवाज थेट आवाजी आदेशाने नियंत्रित करा.</span>
          </div>
          <div className="bg-emerald-50/60 p-3 rounded-2xl border border-emerald-100">
            <span className="text-xs font-bold text-emerald-950 block">🌐 इंटरनेट सर्च व वाचन</span>
            <span className="text-[11px] text-slate-600">हवामान, ताज्या बातम्या, क्रिकेट स्कोअर शोधून तुमच्या साथीदाराच्या आवाजात ऐका.</span>
          </div>
        </div>
      </section>

      {/* 2. Privacy & Data Protection (प्रायव्हसी व डेटा सुरक्षा) */}
      <section className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-600" />
          <span>डेटा प्रायव्हसी व सुरक्षा हमी (Privacy Policy)</span>
        </h3>

        <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
          <div className="flex items-start gap-2.5 p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <strong className="text-emerald-950">स्थानिक ऑन-डिव्हाइस स्टोरेज (100% On-Device):</strong>
              <p className="text-[11px] text-slate-600 mt-0.5">
                तुमचे प्रोफाइल्स, नोट्स, अलार्म्स, आणि रेकॉर्ड केलेले व्हॉईस सॅम्पल्स पूर्णपणे तुमच्या फोनच्या सुरक्षित <code>localStorage</code> मध्ये साठवले जातात.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 bg-blue-50/60 rounded-2xl border border-blue-100">
            <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <strong className="text-blue-950">थर्ड पार्टी जाहिरात किंवा विक्री नाही (Zero Data Selling):</strong>
              <p className="text-[11px] text-slate-600 mt-0.5">
                तुमचा कोणताही वैयक्तिक डेटा, आवाज किंवा ओळख कोणत्याही जाहिरातदार कंपनीला किंवा बाह्य एजन्सीला विकली जात नाही.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 bg-purple-50/60 rounded-2xl border border-purple-100">
            <CheckCircle2 className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
            <div>
              <strong className="text-purple-950">मायक्रोफोन डेटा सुरक्षा (Microphone Security):</strong>
              <p className="text-[11px] text-slate-600 mt-0.5">
                मायक्रोफोनचा वापर केवळ तुमचा आवाज ऐकून उत्तरे देण्यासाठी व कार्य करण्यासाठी होतो. कोणतेही ऑडिओ संभाषण अनधिकृतपणे रेकॉर्ड केले जात नाही.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Third-Party Integrations & Controls (थर्ड-पार्टी वापर व नियंत्रण) */}
      <section className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-600" />
          <span>थर्ड-पार्टी वापर आणि युजर नियंत्रण (Third-Party & User Controls)</span>
        </h3>

        <div className="space-y-2.5 text-xs">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">Google Gemini AI Engine</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">सक्रिय (Active)</span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1">
              भाषा प्रक्रिया, भावना समजणे आणि Google Search ग्राउंडिंगसाठी सुरक्षित HTTPS सर्व्हर-साइड कॉल केला जातो. ब्राउझरमध्ये कोणतीही की उघड होत नाही.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">हार्डवेअर कॅमेरा / फ्लॅशलाइट API</span>
              <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-semibold">स्थानिक (Local Hardware)</span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1">
              टॉर्च पेटवण्यासाठी केवळ स्थानिक हार्डवेअर कन्सट्रेंट्स वापरले जातात. कोणतीही प्रतिमा इंटरनेटवर पाठवली जात नाही.
            </p>
          </div>
        </div>

        {/* Action Buttons for User Control */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onOpenPermissions}
            className="w-full py-2.5 px-4 bg-purple-50 hover:bg-purple-100 text-purple-900 rounded-2xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer border border-purple-200"
          >
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-700" />
              <span>मोबाईल परवानग्या व्यवस्थापित करा (Manage Permissions)</span>
            </span>
            <span>बदला →</span>
          </button>

          <button
            type="button"
            onClick={onExportData}
            className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-2xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer border border-slate-200"
          >
            <span className="flex items-center gap-2">
              <Download className="w-4 h-4 text-indigo-600" />
              <span>माझा सर्व स्थानिक डेटा डाउनलोड करा (Export Data JSON)</span>
            </span>
            <span>डाउनलोड</span>
          </button>

          <button
            type="button"
            onClick={() => setShowConfirmReset(true)}
            className="w-full py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-700 rounded-2xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer border border-red-200"
          >
            <span className="flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-red-600" />
              <span>सर्व स्थानिक डेटा आणि प्रोफाइल्स पुसून टाका (Reset All)</span>
            </span>
            <span>रीसेट</span>
          </button>
        </div>
      </section>

      {/* Confirmation Modal for Reset */}
      {showConfirmReset && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-base text-slate-900">सर्व डेटा पुसून टाकायचा आहे का?</h4>
            <p className="text-xs text-slate-600">
              याने तुमचे सर्व कस्टम प्रोफाइल्स, नोट्स, अलार्म्स आणि रेकॉर्डिंग्ज डिलीट होऊन ऍप मूळ स्थितीत येईल.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmReset(false)}
                className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
              >
                रद्द करा
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearAllData();
                  setShowConfirmReset(false);
                }}
                className="flex-1 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md"
              >
                होय, पुसून टाका
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
