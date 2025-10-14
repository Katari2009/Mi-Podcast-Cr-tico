import React, { useState, useEffect, useRef } from 'react';
import useLocalStorage from './hooks/useLocalStorage';
import { AppStep, PodcastData } from './types';
import { generateScript } from './services/geminiService';

// --- HELPER & UI COMPONENTS (defined in the same file to reduce file count) ---

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-card border border-border-light rounded-2xl shadow-2xl shadow-black/20 p-8 w-full max-w-3xl backdrop-blur-sm bg-opacity-80 ${className}`}>
    {children}
  </div>
);

const Button: React.FC<{ onClick: () => void; children: React.ReactNode; variant?: 'primary' | 'secondary' | 'danger'; disabled?: boolean; className?: string }> = ({ onClick, children, variant = 'primary', disabled = false, className = '' }) => {
  const baseClasses = 'px-6 py-3 rounded-lg font-semibold text-base transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-card';
  const variantClasses = {
    primary: 'bg-accent text-bg hover:bg-opacity-80 disabled:bg-muted/30 disabled:text-muted disabled:cursor-not-allowed',
    secondary: 'bg-border-light text-ink hover:bg-border-dark disabled:bg-muted/10 disabled:text-muted/50 disabled:cursor-not-allowed',
    danger: 'bg-danger text-white hover:bg-opacity-80 disabled:bg-muted/30 disabled:text-muted disabled:cursor-not-allowed',
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </button>
  );
};

const Loader: React.FC<{ text: string }> = ({ text }) => (
  <div className="flex flex-col items-center justify-center gap-4 text-center">
    <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
    <p className="text-muted text-lg">{text}</p>
  </div>
);

// --- ICONS ---
const IconWrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-6 h-6 ${className}`}>{children}</svg>
);
const SparklesIcon = () => <IconWrapper><path fillRule="evenodd" d="M9.315 7.584C12.195 3.883 16.695 1.5 21.75 1.5a.75.75 0 0 1 .75.75c0 5.056-2.383 9.555-6.084 12.436A6.75 6.75 0 0 1 9.75 22.5a.75.75 0 0 1-.75-.75v-4.131A15.838 15.838 0 0 1 6.382 15H2.25a.75.75 0 0 1-.75-.75 6.75 6.75 0 0 1 7.815-6.666ZM15 6.75a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" clipRule="evenodd" /><path d="M5.26 17.242a.75.75 0 1 0-.897-1.203 5.243 5.243 0 0 0-2.05 5.022.75.75 0 0 0 .625.627 5.243 5.243 0 0 0 5.022-2.051.75.75 0 1 0-1.202-.897 3.744 3.744 0 0 1-3.006 1.511 3.744 3.744 0 0 1-1.51-3.006Z" /></IconWrapper>;
const MicIcon = () => <IconWrapper><path d="M12 18.75a6 6 0 0 0 6-6v-1.5a6 6 0 0 0-12 0v1.5a6 6 0 0 0 6 6ZM10.5 4.875c0-1.036.84-1.875 1.875-1.875h.375c1.036 0 1.875.84 1.875 1.875v4.5c0 1.036-.84 1.875-1.875-1.875h-.375C11.34 11.25 10.5 10.41 10.5 9.375v-4.5Z" /><path d="M8.25 12a.75.75 0 0 0 0 1.5h7.5a.75.75 0 0 0 0-1.5h-7.5Z" /></IconWrapper>;
const StopIcon = () => <IconWrapper><path fillRule="evenodd" d="M4.5 7.5a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3v9a3 3 0 0 1-3-3h-9a3 3 0 0 1-3-3v-9Z" clipRule="evenodd" /></IconWrapper>;
const PlayIcon = () => <IconWrapper><path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.647c1.295.742 1.295 2.545 0 3.286L7.279 20.99c-1.25.72-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" /></IconWrapper>;
const DownloadIcon = () => <IconWrapper><path fillRule="evenodd" d="M12 2.25a.75.75 0 0 1 .75.75v11.69l3.22-3.22a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 1 1 1.06-1.06l3.22 3.22V3a.75.75 0 0 1 .75-.75Zm-9 13.5a.75.75 0 0 1 .75.75v2.25a1.5 1.5 0 0 0 1.5 1.5h10.5a1.5 1.5 0 0 0 1.5-1.5V16.5a.75.75 0 0 1 1.5 0v2.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V16.5a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" /></IconWrapper>;
const RestartIcon = () => <IconWrapper><path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.823 8.342a.75.75 0 0 1 1.06 0l2.5 2.5a.75.75 0 0 1 0 1.06l-2.5 2.5a.75.75 0 1 1-1.06-1.06L11.94 13.5l-1.762-1.763a.75.75 0 0 1 0-1.061Z" clipRule="evenodd" /></IconWrapper>;

// --- STEP COMPONENTS ---

interface StepProps {
    data: PodcastData;
    setData: React.Dispatch<React.SetStateAction<PodcastData>>;
    onNext: () => void;
    onBack?: () => void;
}

const IntroductionStep: React.FC<{ onNext: () => void }> = ({ onNext }) => (
    <Card className="text-center flex flex-col items-center gap-6">
        <div className="bg-accent/10 border border-accent/20 rounded-full p-4 w-fit">
            <MicIcon/>
        </div>
        <h1 className="text-4xl font-bold">Bienvenido a Mi Podcast Crítico</h1>
        <p className="text-muted max-w-xl">
            Esta herramienta te guiará paso a paso para crear tu propio podcast de análisis crítico. Desde la idea inicial hasta la grabación final, te ayudaremos a estructurar tus pensamientos y a compartirlos con el mundo.
        </p>
        <Button onClick={onNext} className="mt-4">
            Comenzar a Crear
        </Button>
    </Card>
);

const StepIndicator: React.FC<{ currentStep: number }> = ({ currentStep }) => {
    const steps = ['Tema', 'Guion', 'Grabar', 'Finalizar'];
    const activeStepIndex = currentStep - 1;

    return (
        <div className="flex items-center justify-center space-x-2 sm:space-x-4 mb-12">
            {steps.map((step, index) => (
                <React.Fragment key={step}>
                    <div className="flex items-center space-x-2">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors duration-300 ${index <= activeStepIndex ? 'bg-accent text-bg' : 'bg-card border-2 border-border-light text-muted'}`}>
                            <span className="font-bold">{index + 1}</span>
                        </div>
                        <span className={`font-semibold hidden sm:inline ${index <= activeStepIndex ? 'text-ink' : 'text-muted'}`}>{step}</span>
                    </div>
                    {index < steps.length - 1 && (
                        <div className={`flex-1 h-1 rounded-full transition-colors duration-300 ${index < activeStepIndex ? 'bg-accent' : 'bg-border-light'}`}></div>
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};

const TopicStep: React.FC<Omit<StepProps, 'onBack'>> = ({ data, setData, onNext }) => {
    const canProceed = data.topic.trim().length > 5 && data.keyPoints.trim().length > 10;
    return (
        <Card>
            <h2 className="text-2xl font-bold mb-1">Paso 1: Define tu Tema</h2>
            <p className="text-muted mb-6">¿Sobre qué quieres hablar? Un buen tema es la base de un gran podcast.</p>
            <div className="space-y-6">
                <div>
                    <label htmlFor="topic" className="block text-sm font-medium text-muted mb-2">Tema Principal del Podcast</label>
                    <input
                        id="topic"
                        type="text"
                        value={data.topic}
                        onChange={(e) => setData(prev => ({ ...prev, topic: e.target.value }))}
                        placeholder="Ej: El impacto de las redes sociales en la política actual"
                        className="w-full bg-bg border border-border-light rounded-lg px-4 py-2 text-ink placeholder-muted/50 focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                </div>
                <div>
                    <label htmlFor="keyPoints" className="block text-sm font-medium text-muted mb-2">Puntos Clave o Preguntas a Explorar</label>
                    <textarea
                        id="keyPoints"
                        value={data.keyPoints}
                        onChange={(e) => setData(prev => ({ ...prev, keyPoints: e.target.value }))}
                        rows={5}
                        placeholder="- ¿Cómo influyen los algoritmos en la opinión pública?\n- Ejemplos de campañas políticas exitosas en redes.\n- Riesgos de la desinformación y las 'fake news'."
                        className="w-full bg-bg border border-border-light rounded-lg px-4 py-2 text-ink placeholder-muted/50 focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                </div>
            </div>
            <div className="mt-8 flex justify-end">
                <Button onClick={onNext} disabled={!canProceed}>Siguiente Paso: Crear Guion</Button>
            </div>
        </Card>
    );
};

const ScriptStep: React.FC<StepProps> = ({ data, setData, onNext, onBack }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerateScript = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const script = await generateScript(data.topic, data.keyPoints);
            setData(prev => ({ ...prev, script }));
        } catch (e: any) {
            setError(e.message || "Ocurrió un error inesperado.");
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <Card>
            <h2 className="text-2xl font-bold mb-1">Paso 2: Prepara tu Guion</h2>
            <p className="text-muted mb-6">Usa la IA para generar un borrador o edita el tuyo. Un guion bien estructurado es clave para un mensaje claro.</p>
            
            {isLoading ? (
                <Loader text="La IA está escribiendo tu guion..."/>
            ) : (
                <>
                    <div className="space-y-4">
                       <div className="flex flex-col items-center text-center mb-6">
                            <Button onClick={handleGenerateScript} disabled={isLoading}>
                                <div className="flex items-center gap-2">
                                    <SparklesIcon />
                                    {data.script ? 'Generar de Nuevo con IA' : 'Generar Guion con IA'}
                                </div>
                            </Button>
                        </div>
                        {error && <p className="text-danger text-center mb-4">{error}</p>}
                        <div>
                            <label htmlFor="script" className="block text-sm font-medium text-muted mb-2">Guion del Podcast</label>
                            <textarea
                                id="script"
                                value={data.script}
                                onChange={(e) => setData(prev => ({ ...prev, script: e.target.value }))}
                                rows={12}
                                placeholder="Escribe tu guion aquí o genera uno con la IA."
                                className="w-full bg-bg border border-border-light rounded-lg px-4 py-2 text-ink placeholder-muted/50 focus:outline-none focus:ring-2 focus:ring-accent"
                            />
                        </div>
                    </div>
                    <div className="mt-8 flex justify-between">
                        <Button onClick={onBack!} variant="secondary">Anterior</Button>
                        <Button onClick={onNext} disabled={data.script.trim().length < 50}>Siguiente Paso: Grabar</Button>
                    </div>
                </>
            )}
        </Card>
    );
};

interface RecordingStepProps extends StepProps {
    recordingUrl: string | null;
    setRecordingUrl: (url: string | null) => void;
}

const RecordingStep: React.FC<RecordingStepProps> = ({ data, onNext, onBack, recordingUrl, setRecordingUrl }) => {
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    
    useEffect(() => {
        // Clean up object URL on component unmount to avoid memory leaks
        return () => {
            if (recordingUrl) {
                URL.revokeObjectURL(recordingUrl);
            }
        };
    }, [recordingUrl]);


    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const url = URL.createObjectURL(audioBlob);
                setRecordingUrl(url);
                setIsRecording(false);
                stream.getTracks().forEach(track => track.stop());
            };
            
            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("No se pudo acceder al micrófono. Por favor, verifica los permisos en tu navegador.");
        }
    };
    
    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
        }
    };

    const resetRecording = () => {
        if (recordingUrl) {
            URL.revokeObjectURL(recordingUrl);
        }
        setRecordingUrl(null);
        setIsRecording(false);
    }

    return (
        <Card>
             <h2 className="text-2xl font-bold mb-1">Paso 3: ¡A Grabar!</h2>
            <p className="text-muted mb-6">Lee tu guion en voz alta. Habla con claridad y pasión. No te preocupes por los errores, ¡puedes grabar cuantas veces quieras!</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-bg border border-border-light rounded-lg p-4 h-96 overflow-y-auto">
                    <h3 className="font-bold text-lg mb-2 text-accent">Tu Guion</h3>
                    <pre className="text-muted whitespace-pre-wrap font-sans text-sm">{data.script || "No hay guion disponible."}</pre>
                </div>
                <div className="flex flex-col items-center justify-center bg-bg border border-border-light rounded-lg p-4 space-y-6">
                    {!isRecording && !recordingUrl && (
                        <Button onClick={startRecording} className="flex items-center gap-2 text-lg">
                            <MicIcon/> Iniciar Grabación
                        </Button>
                    )}
                    {isRecording && (
                        <>
                         <div className="text-center">
                            <div className="relative w-24 h-24 flex items-center justify-center">
                                <div className="absolute inset-0 bg-danger/20 rounded-full animate-ping"></div>
                                <div className="relative bg-danger w-16 h-16 rounded-full flex items-center justify-center text-white">
                                    <MicIcon/>
                                </div>
                            </div>
                            <p className="text-danger font-semibold mt-4">Grabando...</p>
                        </div>
                        <Button onClick={stopRecording} variant="danger" className="flex items-center gap-2 text-lg">
                            <StopIcon/> Detener
                        </Button>
                        </>
                    )}
                    {!isRecording && recordingUrl && (
                        <div className="w-full text-center space-y-4">
                            <h3 className="font-bold text-ok">¡Grabación Lista!</h3>
                            <audio controls src={recordingUrl} className="w-full"></audio>
                            <Button onClick={resetRecording} variant="secondary">Grabar de Nuevo</Button>
                        </div>
                    )}
                </div>
            </div>
             <div className="mt-8 flex justify-between">
                <Button onClick={onBack!} variant="secondary">Anterior</Button>
                <Button onClick={onNext} disabled={!recordingUrl}>Siguiente Paso: Finalizar</Button>
            </div>
        </Card>
    );
};

interface CompletionStepProps {
    data: PodcastData;
    recordingUrl: string | null;
    onRestart: () => void;
}


const CompletionStep: React.FC<CompletionStepProps> = ({ data, recordingUrl, onRestart }) => {
    
    const downloadRecording = () => {
        if (!recordingUrl) return;
        const link = document.createElement('a');
        link.href = recordingUrl;
        const fileName = data.topic.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'podcast';
        link.download = `${fileName}.webm`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Card className="text-center flex flex-col items-center gap-6">
            <div className="bg-ok/10 border border-ok/20 rounded-full p-4 w-fit text-ok">
                <PlayIcon/>
            </div>
            <h1 className="text-4xl font-bold">¡Felicidades, tu podcast está listo!</h1>
            <p className="text-muted max-w-xl">
                Has completado todos los pasos. Ahora puedes descargar tu grabación y compartirla. ¡Gran trabajo!
            </p>
            <div className="flex items-center gap-4 mt-4">
                <Button onClick={downloadRecording} disabled={!recordingUrl} className="flex items-center gap-2">
                   <DownloadIcon/> Descargar Audio
                </Button>
                <Button onClick={onRestart} variant="secondary" className="flex items-center gap-2">
                    <RestartIcon/> Crear Nuevo Podcast
                </Button>
            </div>
        </Card>
    );
};

// --- MAIN APP COMPONENT ---

const initialData: PodcastData = {
  topic: '',
  keyPoints: '',
  script: '',
};

const backgrounds: Record<AppStep, string> = {
    [AppStep.INTRODUCTION]: 'https://images.unsplash.com/photo-1590650213165-c1fef80648c4?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3',
    [AppStep.TOPIC]: 'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3',
    [AppStep.SCRIPT]: 'https://images.unsplash.com/photo-1558909156-f5b2b2a24c25?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3',
    [AppStep.RECORDING]: 'https://images.unsplash.com/photo-1590402494811-8ffd29f3154b?q=80&w=1932&auto=format&fit=crop&ixlib=rb-4.0.3',
    [AppStep.COMPLETED]: 'https://images.unsplash.com/photo-1614063211528-b4bd37b2d56c?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3',
};


const App: React.FC = () => {
    const [step, setStep] = useLocalStorage<AppStep>('podcast-step', AppStep.INTRODUCTION);
    const [podcastData, setPodcastData] = useLocalStorage<PodcastData>('podcast-data', initialData);
    const [recordingUrl, setRecordingUrl] = useState<string | null>(null);

    const initialBg = backgrounds[step] || backgrounds[AppStep.INTRODUCTION];
    const [bg1, setBg1] = useState({ url: initialBg, opacity: 1 });
    const [bg2, setBg2] = useState({ url: '', opacity: 0 });
    const [activeBg, setActiveBg] = useState(1);


    useEffect(() => {
        // --- One-time cleanup for old localStorage data ---
        try {
            const rawData = window.localStorage.getItem('podcast-data');
            if (rawData) {
                const parsedData = JSON.parse(rawData);
                if (parsedData && typeof parsedData === 'object' && 'recordingBase64' in parsedData) {
                    console.log("Old data structure detected. Cleaning localStorage to prevent GitHub sync issues.");
                    const cleanedData: PodcastData = {
                        topic: parsedData.topic || '',
                        keyPoints: parsedData.keyPoints || '',
                        script: parsedData.script || '',
                    };
                    window.localStorage.setItem('podcast-data', JSON.stringify(cleanedData));
                }
            }
        } catch (error) {
            console.error("Error during localStorage cleanup:", error);
        }
    }, []);

    useEffect(() => {
        const newUrl = backgrounds[step];
        if ((activeBg === 1 && newUrl === bg1.url) || (activeBg === 2 && newUrl === bg2.url)) {
            return;
        }

        if (activeBg === 1) {
            setBg2({ url: newUrl, opacity: 1 });
            setBg1(prev => ({ ...prev, opacity: 0 }));
            setActiveBg(2);
        } else {
            setBg1({ url: newUrl, opacity: 1 });
            setBg2(prev => ({ ...prev, opacity: 0 }));
            setActiveBg(1);
        }
    }, [step, activeBg, bg1.url, bg2.url]);


    const restart = () => {
        if (window.confirm("¿Estás seguro de que quieres empezar de nuevo? Se borrará todo tu progreso.")) {
            setPodcastData(initialData);
            setRecordingUrl(null);
            setStep(AppStep.INTRODUCTION);
        }
    };

    const renderCurrentStep = () => {
        switch (step) {
            case AppStep.INTRODUCTION:
                return <IntroductionStep onNext={() => setStep(AppStep.TOPIC)} />;
            case AppStep.TOPIC:
                return <TopicStep data={podcastData} setData={setPodcastData} onNext={() => setStep(AppStep.SCRIPT)} />;
            case AppStep.SCRIPT:
                return <ScriptStep data={podcastData} setData={setPodcastData} onNext={() => setStep(AppStep.RECORDING)} onBack={() => setStep(AppStep.TOPIC)} />;
            case AppStep.RECORDING:
                return <RecordingStep data={podcastData} setData={setPodcastData} onNext={() => setStep(AppStep.COMPLETED)} onBack={() => setStep(AppStep.SCRIPT)} recordingUrl={recordingUrl} setRecordingUrl={setRecordingUrl}/>;
            case AppStep.COMPLETED:
                return <CompletionStep data={podcastData} onRestart={restart} recordingUrl={recordingUrl} />;
            default:
                setStep(AppStep.INTRODUCTION); // Fallback to introduction
                return <IntroductionStep onNext={() => setStep(AppStep.TOPIC)} />;
        }
    };
    
    const gradient = 'linear-gradient(to bottom, rgba(12, 15, 20, 0.85), rgba(15, 17, 21, 0.98))';
    const bgStyle: React.CSSProperties = {
        position: 'fixed',
        inset: 0,
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        transition: 'opacity 1.5s ease-in-out',
        zIndex: -1,
    };

    return (
        <>
            <div style={{...bgStyle, backgroundImage: `${gradient}, url(${bg1.url})`, opacity: bg1.opacity }} />
            <div style={{...bgStyle, backgroundImage: `${gradient}, url(${bg2.url})`, opacity: bg2.opacity }} />
            <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-8">
                <header className="absolute top-6 text-center">
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <span className="text-accent"><MicIcon/></span>
                        Mi Podcast Crítico
                    </h1>
                </header>
                
                <main className="w-full flex flex-col items-center">
                    {step > AppStep.INTRODUCTION && step < AppStep.COMPLETED && <StepIndicator currentStep={step} />}
                    {renderCurrentStep()}
                </main>
                
                <footer className="absolute bottom-6 text-center text-muted text-sm">
                    <p>Creado con IA para potenciar la creatividad estudiantil.</p>
                </footer>
            </div>
        </>
    );
};

export default App;