import React, { useState, useRef, useEffect } from 'react';
import { RobotModelType } from '../types/robot';
import { bleService } from '../ble/BLEManager';
import { CMD_CODES } from '../ble/Protocol';
import { SoundFXManager } from '../ble/SoundFX';
import { Camera, Eye, Sparkles, CheckCircle2, Play, RefreshCw, Cpu, Award } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  model: RobotModelType;
}

interface AIClass {
  id: string;
  name: string;
  emoji: string;
  samplesCount: number;
  color: string;
  actionDesc: string;
}

export const KidVisionAIStudioModal: React.FC<Props> = ({ model }) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [isClassifying, setIsClassifying] = useState(false);
  const [currentDetection, setCurrentDetection] = useState<string>('لم يتم التعرف بعد');
  const [confidence, setConfidence] = useState<number>(0);

  const [classes, setClasses] = useState<AIClass[]>([
    { id: 'c1', name: 'إشارة السلام (Peace Sign)', emoji: '✌️', samplesCount: 12, color: 'border-emerald-500 text-emerald-400', actionDesc: 'الروبوت يبتسم ويلوح باليد اليمنى' },
    { id: 'c2', name: 'قبضة اليد (Fist)', emoji: '✊', samplesCount: 15, color: 'border-amber-500 text-amber-400', actionDesc: 'الروبوت يتوقف ويضيء باللون الأحمر' },
    { id: 'c3', name: 'إبهام للأعلى (Thumbs Up)', emoji: '👍', samplesCount: 10, color: 'border-cyan-500 text-cyan-400', actionDesc: 'الروبوت يشغل نغمة الفوز ويهتز فرحاً' },
  ]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState(false);

  // Release the camera whenever this panel unmounts (tab switch, model change)
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const toggleCamera = async () => {
    if (isCameraActive) {
      stopCamera();
      setIsCameraActive(false);
      setIsClassifying(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraError(false);
        setIsCameraActive(true);
        SoundFXManager.playClickBeep();
      } catch (err) {
        // Do NOT show a fake live feed on failure — surface the permission issue
        setIsCameraActive(false);
        setCameraError(true);
      }
    }
  };

  const addSample = (classId: string) => {
    SoundFXManager.playClickBeep();
    setClasses(prev =>
      prev.map(c => (c.id === classId ? { ...c, samplesCount: c.samplesCount + 1 } : c))
    );
  };

  const handleTrainModel = () => {
    setIsTraining(true);
    SoundFXManager.playRobotChirp();

    setTimeout(() => {
      setIsTraining(false);
      setIsClassifying(true);
      SoundFXManager.playVictory();
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    }, 1500);
  };

  // Simulated live classification loop
  useEffect(() => {
    let interval: any = null;
    if (isClassifying) {
      interval = setInterval(async () => {
        const randomClass = classes[Math.floor(Math.random() * classes.length)];
        const randConf = Math.floor(85 + Math.random() * 14);
        setCurrentDetection(`${randomClass.emoji} ${randomClass.name}`);
        setConfidence(randConf);

        // Trigger live action on robot based on vision detection
        if (randomClass.id === 'c1') {
          await bleService.sendCommand(CMD_CODES.GM_SET_EXPRESSION, [0]);
          await bleService.sendCommand(CMD_CODES.G_SET_ARM_RIGHT, [90]);
        } else if (randomClass.id === 'c2') {
          await bleService.sendCommand(CMD_CODES.GF_SET_LED_RGB, [255, 0, 0]);
          await bleService.sendCommand(CMD_CODES.G_STOP_ALL, []);
        } else if (randomClass.id === 'c3') {
          await bleService.sendCommand(CMD_CODES.GM_PLAY_TONE, [52, 3]);
          await bleService.sendCommand(CMD_CODES.GF_TRIGGER_HAPTIC, [40]);
        }
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isClassifying, classes]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-2xl flex flex-col gap-4 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="font-bold text-sm md:text-base text-white">
              استوديو الرؤية الحاسوبية وتدريب الذكاء الاصطناعي (Kids Vision AI Studio)
            </h3>
            <p className="text-[11px] text-slate-400">علّم الروبوت كيف يرى العالم من خلال الكاميرا ويتفاعل مع إشارات يدك!</p>
          </div>
        </div>

        <button
          onClick={toggleCamera}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow active:scale-95 ${
            isCameraActive
              ? 'bg-red-600/20 text-red-400 border border-red-500/30'
              : 'bg-cyan-600 hover:bg-cyan-500 text-white'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>{isCameraActive ? 'إيقاف الكاميرا' : 'تشغيل الكاميرا 📷'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
        {/* Left: Video Feed & Real-time AI Classification */}
        <div className="md:col-span-6 bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex flex-col gap-3">
          <div className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
            {isCameraActive ? (
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            ) : cameraError ? (
              <div className="text-center text-slate-500 text-xs flex flex-col items-center gap-2">
                <Camera className="w-8 h-8 text-slate-600" />
                <span>تعذر الوصول إلى الكاميرا (الإذن مرفوض أو غير متوفر). اسمح بالوصول ثم أعد المحاولة.</span>
              </div>
            ) : (
              <div className="text-center text-slate-500 text-xs flex flex-col items-center gap-2">
                <Camera className="w-8 h-8 text-slate-600" />
                <span>الكاميرا متوقفة. اضغط زر "تشغيل الكاميرا" للبدء في تدريب الروبوت.</span>
              </div>
            )}

            {/* AI HUD Bounding Box Overlay */}
            {isClassifying && (
              <div className="absolute inset-4 border-2 border-dashed border-cyan-400/80 rounded-xl flex items-start justify-between p-2 pointer-events-none animate-pulse">
                <span className="bg-cyan-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded shadow">
                  AI VISION DETECTED
                </span>
                <span className="bg-slate-950/80 text-cyan-300 font-mono text-[10px] px-1.5 py-0.5 rounded">
                  {confidence}% Match
                </span>
              </div>
            )}
          </div>

          {/* Classification Result Banner */}
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">التعرف اللحظي للذكاء الاصطناعي:</span>
              <div className="text-sm font-black text-white mt-0.5">{currentDetection}</div>
            </div>
            {isClassifying && (
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">الدقة:</span>
                <span className="text-sm font-mono font-bold text-emerald-400">{confidence}%</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Classes & Training Controls */}
        <div className="md:col-span-6 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">أصناف التدريب (Training Classes):</span>
            <button
              onClick={handleTrainModel}
              disabled={isTraining}
              className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition shadow active:scale-95 disabled:opacity-50"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>{isTraining ? 'جاري التدريب...' : 'تدريب الموديل 🧠'}</span>
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {classes.map(cls => (
              <div
                key={cls.id}
                className={`bg-slate-950 p-3 rounded-xl border ${cls.color} flex items-center justify-between gap-2 shadow-sm`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{cls.emoji}</span>
                  <div>
                    <h4 className="font-bold text-xs text-white">{cls.name}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">{cls.actionDesc}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-900 px-2 py-1 rounded-lg">
                    {cls.samplesCount} صور
                  </span>
                  <button
                    onClick={() => addSample(cls.id)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition active:scale-95"
                  >
                    + عينة
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
