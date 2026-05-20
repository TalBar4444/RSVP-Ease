import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';

interface Guest {
  id: string;
  name: string;
  status: string;
  guests_count: number;
  children_count: number;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  other_dietary_notes: string | null;
}

function App() {
  const [guest, setGuest] = useState<Guest | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // Form states matching table schema
  const [status, setStatus] = useState<string>('pending');
  const [guestsCount, setGuestsCount] = useState<number>(1);
  const [childrenCount, setChildrenCount] = useState<number>(0);
  const [isVegetarian, setIsVegetarian] = useState<boolean>(false);
  const [isVegan, setIsVegan] = useState<boolean>(false);
  const [isGlutenFree, setIsGlutenFree] = useState<boolean>(false);
  const [otherDietary, setOtherDietary] = useState<string>('');
  const [showOtherText, setShowOtherText] = useState<boolean>(false);

  useEffect(() => {
    async function fetchGuest() {
      try {
        const params = new URLSearchParams(window.location.search);
        const guestId = params.get('id');

        if (!guestId) {
          setError('נא להיכנס דרך הקישור האישי שקיבלת בוואטסאפ.');
          setLoading(false);
          return;
        }

        const { data, error: supabaseError } = await supabase
          .from('guests')
          .select('*') // Fetching all columns for the form
          .eq('id', guestId)
          .single();

        if (supabaseError) throw supabaseError;
        
        if (data) {
          const fetchedGuest = data as Guest;
          setGuest(fetchedGuest);
          
          // Initialize form states with current DB values
          setStatus(fetchedGuest.status);
          setGuestsCount(fetchedGuest.guests_count || 1);
          setChildrenCount(fetchedGuest.children_count || 0);
          setIsVegetarian(fetchedGuest.is_vegetarian);
          setIsVegan(fetchedGuest.is_vegan);
          setIsGlutenFree(fetchedGuest.is_gluten_free);
          setOtherDietary(fetchedGuest.other_dietary_notes || '');
          if (fetchedGuest.other_dietary_notes) setShowOtherText(true);
        } else {
          setError('אורח לא נמצא במערכת.');
        }
      } catch (err: any) {
        console.error(err);
        setError('אירעה שגיאה בטעינת הנתונים.');
      } finally {
        setLoading(false);
      }
    }

    fetchGuest();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guest) return;

    setSubmitting(true);
    try {
      // Prepare values based on attendance status
      const isAttending = status === 'attending';
      
      const { error: updateError } = await supabase
        .from('guests')
        .update({
          status,
          guests_count: isAttending ? guestsCount : 0,
          children_count: isAttending ? childrenCount : 0,
          is_vegetarian: isAttending ? isVegetarian : false,
          is_vegan: isAttending ? isVegan : false,
          is_gluten_free: isAttending ? isGlutenFree : false,
          other_dietary_notes: (isAttending && showOtherText) ? otherDietary : null,
          updated_at: new Date().toISOString() // Track when the guest responded
        })
        .eq('id', guest.id);

      if (updateError) throw updateError;
      setSuccess(true);
    } catch (err) {
      console.error(err);
      alert('אירעה שגיאה בעדכון התשובה. נא לנסות שוב.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white dir-rtl" dir="rtl">
        <p className="text-xl animate-pulse">טוען את פרטי ההזמנה שלך...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white p-4 dir-rtl" dir="rtl">
        <div className="bg-rose-950/40 border border-rose-800 p-6 rounded-2xl max-w-sm text-center">
          <p className="text-rose-300 text-lg font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white p-4 dir-rtl" dir="rtl">
        <div className="bg-slate-800 p-8 rounded-2xl shadow-xl text-center max-w-md w-full border border-slate-700 animate-fade-in">
          <h1 className="text-4xl mb-4">תודה רבה! 🎉</h1>
          <p className="text-slate-300 text-lg">התשובה שלך נשמרה במערכת ועודכנה בהצלחה.</p>
          {status === 'attending' ? (
            <p className="text-indigo-400 mt-2 font-medium">נתראה בשמחה שלנו!</p>
          ) : (
            <p className="text-slate-400 mt-2">נתגעגע אליכם, תודה שעדכנתם.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white p-4 dir-rtl" dir="rtl">
      <div className="bg-slate-800 p-6 sm:p-8 rounded-2xl shadow-xl max-w-md w-full border border-slate-700">
        
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-extrabold text-indigo-400 mb-2">שלום, {guest?.name}! ✉️</h1>
          <p className="text-slate-300 text-sm">נשמח מאוד לעדכון בנוגע להגעתכם לאירוע</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Attendance Status Buttons */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-400 block">האם תגיעו לחגוג איתנו?</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStatus('attending')}
                className={`py-3 rounded-xl font-bold border transition-all ${
                  status === 'attending'
                    ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-900/30'
                    : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700'
                }`}
              >
                בטח שמגיעים! 🎉
              </button>
              <button
                type="button"
                onClick={() => setStatus('declined')}
                className={`py-3 rounded-xl font-bold border transition-all ${
                  status === 'declined'
                    ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-900/30'
                    : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700'
                }`}
              >
                לא נוכל להגיע 😔
              </button>
            </div>
          </div>

          {/* Attending Sub-form */}
          {status === 'attending' && (
            <div className="space-y-5 p-4 bg-slate-700/30 rounded-xl border border-slate-700/50 animate-fade-in">
              
              {/* Counter: Adults */}
              <div className="flex justify-between items-center">
                <div>
                  <label className="font-medium text-slate-200 block">כמות מבוגרים</label>
                  <span className="text-xs text-slate-400">כולל אותך</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setGuestsCount(Math.max(1, guestsCount - 1))}
                    className="w-8 h-8 rounded-full bg-slate-600 hover:bg-slate-500 flex items-center justify-center font-bold text-lg"
                  >
                    -
                  </button>
                  <span className="text-xl font-bold w-6 text-center">{guestsCount}</span>
                  <button
                    type="button"
                    onClick={() => setGuestsCount(guestsCount + 1)}
                    className="w-8 h-8 rounded-full bg-slate-600 hover:bg-slate-500 flex items-center justify-center font-bold text-lg"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Counter: Children */}
              <div className="flex justify-between items-center pt-2 border-t border-slate-700/50">
                <div>
                  <label className="font-medium text-slate-200 block">כמות ילדים</label>
                  <span className="text-xs text-slate-400">מנות ילדים באולם</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setChildrenCount(Math.max(0, childrenCount - 1))}
                    className="w-8 h-8 rounded-full bg-slate-600 hover:bg-slate-500 flex items-center justify-center font-bold text-lg"
                  >
                    -
                  </button>
                  <span className="text-xl font-bold w-6 text-center">{childrenCount}</span>
                  <button
                    type="button"
                    onClick={() => setChildrenCount(childrenCount + 1)}
                    className="w-8 h-8 rounded-full bg-slate-600 hover:bg-slate-500 flex items-center justify-center font-bold text-lg"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Dietary Requirements Selection */}
              <div className="pt-3 border-t border-slate-700/50 space-y-2">
                <label className="text-sm font-semibold text-slate-400 block">העדפות קולינריות מיוחדות?</label>
                
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsVegetarian(!isVegetarian)}
                    className={`p-2 text-xs rounded-lg border font-medium transition-all ${
                      isVegetarian ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-300'
                    }`}
                  >
                    🌱 צמחוני
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsVegan(!isVegan)}
                    className={`p-2 text-xs rounded-lg border font-medium transition-all ${
                      isVegan ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-300'
                    }`}
                  >
                    🥕 טבעוני
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsGlutenFree(!isGlutenFree)}
                    className={`p-2 text-xs rounded-lg border font-medium transition-all ${
                      isGlutenFree ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-300'
                    }`}
                  >
                    🌾 ללא גלוטן
                  </button>
                </div>

                {/* Custom dietary option checkbox */}
                <label className="flex items-center gap-2 mt-3 cursor-pointer select-none text-sm text-slate-300 pt-1">
                  <input
                    type="checkbox"
                    checked={showOtherText}
                    onChange={(e) => setShowOtherText(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>יש רגישויות או משהו אחר?</span>
                </label>

                {/* Custom dietary notes input field */}
                {showOtherText && (
                  <textarea
                    value={otherDietary}
                    onChange={(e) => setOtherDietary(e.target.value)}
                    placeholder="פירוט אלרגיות או בקשות מיוחדות..."
                    rows={2}
                    className="w-full mt-2 p-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                  />
                )}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || status === 'pending'}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-xl shadow-lg transition-colors focus:outline-none"
          >
            {submitting ? 'שומר תשובה...' : 'שליחת עדכון'}
          </button>
        </form>

      </div>
    </div>
  );
}

export default App;