// app.js

// Importar React y ReactDOM del objeto global
const { useState, useEffect } = React;

// --- MÓDULO DE FIREBASE ---
// Importar funciones de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth, 
    signInWithPopup, 
    GoogleAuthProvider, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc,
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    deleteDoc // <--- ¡FUNCIÓN CLAVE PARA ELIMINAR!
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { 
    getStorage, 
    ref, 
    uploadBytes, 
    getDownloadURL 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// CONFIGURACIÓN DE FIREBASE (Manteniendo tu configuración)
const firebaseConfig = {
    apiKey: "AIzaSyDsGZJChnW_VgmP2nte6Dff1-KPFklUzCE",
    authDomain: "videos-electorales.firebaseapp.com",
    projectId: "videos-electorales",
    storageBucket: "videos-electorales.firebasestorage.app",
    messagingSenderId: "416369512214",
    appId: "1:416369512214:web:71cd2b9ee80c8dd46bca37",
    measurementId: "G-2XV30BVCX9"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

// --- MÓDULO DE COMPONENTES ---

// HEADER (Sin cambios)
const Header = ({ onNavigate, isAuthenticated, showHomeLink = false, onLogout, user }) => (
    <header className="relative z-10 flex flex-col sm:flex-row justify-between items-center px-6 py-6 max-w-7xl mx-auto w-full">
        <div className="flex flex-col leading-none mb-4 sm:mb-0 cursor-pointer group" onClick={() => onNavigate('home')}>
            <h1 className="text-3xl font-black text-cyan-400 tracking-tight group-hover:opacity-80 transition-opacity">Monitoreo</h1>
            <div className="flex items-center gap-1">
                <span className="text-xl font-bold text-cyan-500 group-hover:opacity-80 transition-opacity">ELECTORAL</span>
                <span className="text-sm font-light text-gray-500 tracking-widest">HN</span>
            </div>
        </div>
        <nav className="flex items-center gap-6 text-sm text-gray-500 font-medium">
            {showHomeLink && (
                <button onClick={() => onNavigate('home')} className="hover:text-cyan-500 transition-colors">Inicio</button>
            )}

            {/* Lógica de Autenticación */}
            {!isAuthenticated ? (
                <>
                    {showHomeLink && <span className="border-l border-gray-300 h-4"></span>}
                    <button onClick={() => onNavigate('login')} className="hover:text-cyan-500 transition-colors">Iniciar sesión</button>
                    <span className="border-l border-gray-300 h-4"></span>
                    <button onClick={() => onNavigate('register')} className="hover:text-cyan-500 transition-colors">Registrarse</button>
                </>
            ) : (
                <>
                    {showHomeLink && <span className="border-l border-gray-300 h-4"></span>}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-cyan-600">
                            <i className="fas fa-user-check"></i>
                            <span className="font-semibold">Hola, {user?.displayName || 'Usuario'}</span>
                        </div>
                        <button onClick={onLogout} className="text-red-400 text-sm hover:underline">Salir</button>
                    </div>
                </>
            )}
        </nav>
    </header>
);

// POST CARD MODIFICADA: Implementa el botón de eliminar
const PostCard = ({ 
    avatar, 
    user, 
    thumbnail, 
    mediaType, 
    title, 
    description, 
    location, 
    time, 
    showUserHeader = true, 
    showDeleteAction = false, 
    postId, 
    onDelete, 
    views = 0 

}) => {
    // Función para actualizar vistas en Firestore
    const handleView = async () => {
        try {
            const postRef = doc(db, "posts", postId);
            const postSnap = await getDoc(postRef);
            if (postSnap.exists()) {
                const currentViews = postSnap.data().views || 0;
                await setDoc(postRef, { views: currentViews + 1 }, { merge: true });
            }
        } catch (error) {
            console.error("Error al actualizar vistas:", error);
        }
    };

    return (
        <div className="flex flex-col gap-2 mb-6 break-inside-avoid">
            {/* Botón eliminar */}
            {showDeleteAction && (
                <div className="flex items-center justify-end gap-4 mb-1">
                    <button onClick={() => onDelete(postId)} className="flex items-center gap-1 text-red-400 hover:text-red-600">
                        <i className="fas fa-trash-alt text-xs"></i>
                        <span className="text-sm font-medium">Eliminar</span>
                    </button>
                </div>
            )}

            {/* Header usuario */}
            {showUserHeader && (
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-full bg-gray-300 overflow-hidden">
                        {avatar ? <img src={avatar} alt={user} className="w-full h-full object-cover" /> : <i className="fas fa-user text-xs"></i>}
                    </div>
                    <span className="text-sm font-semibold text-gray-800">{user}</span>
                </div>
            )}

            {/* Video */}
            <div className="relative w-full aspect-video bg-black rounded-md overflow-hidden shadow-sm">
                {mediaType === 'video' ? (
                    <video 
                        src={thumbnail} 
                        controls 
                        className="w-full h-full object-contain"
                        onPlay={handleView} // 👁️ cada reproducción suma vista
                    ></video>
                ) : (
                    <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
                )}
            </div>

            {/* Info */}
            <div className="flex flex-col gap-1 px-1">
                <h3 className="font-bold text-gray-900 text-lg">{title}</h3>
                <p className="text-sm text-gray-600">{description}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <i className="fas fa-map-marker-alt text-red-500"></i>
                    <span>{location}</span>
                    <span>• {time}</span>
                    <span>• 👁️ {views} vistas</span>
                </div>
            </div>
        </div>
    );
};


// ... (CreatePostView, LoginView, RegisterView, HomeView permanecen igual) ...
const CreatePostView = ({ onNavigate, onPostCreate, isAuthenticated, user, onLogout }) => {
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    
    // Estados para el manejo de archivos
    const [videoFile, setVideoFile] = useState(null);
    const [videoPreview, setVideoPreview] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    // Función al seleccionar archivo
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setVideoFile(file);
            setVideoPreview(URL.createObjectURL(file)); // Crea URL temporal para verlo antes de subir
        }
    };

    const handleSubmit = async () => {
        if (!title || !description) return alert("Por favor añade un título y descripción.");
        if (!videoFile) return alert("Es obligatorio subir un video o foto de evidencia.");

        setIsUploading(true); // Bloqueamos el botón mientras sube
        
        // Enviamos todo a la función principal
        await onPostCreate({
            title,
            description,
            isAnonymous,
            file: videoFile // Pasamos el archivo real
        });
        
        setIsUploading(false);
        // Limpiamos los campos después de subir
        setTitle('');
        setDescription('');
        setVideoFile(null);
        setVideoPreview(null);
    };

    // Fecha actual simple
    const currentDate = new Date().toLocaleDateString('es-ES', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    return (
        <React.Fragment>
            <Header onNavigate={onNavigate} isAuthenticated={isAuthenticated} showHomeLink={true} user={user} onLogout={onLogout} />
            
            <main className="relative z-10 max-w-xl mx-auto px-4 mt-8 flex flex-col items-center pb-20">
                <div className="w-full bg-white rounded-3xl shadow-lg p-6 md:p-8">
                    
                    {/* Header Usuario */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white overflow-hidden ${isAnonymous ? 'bg-gray-500' : 'bg-gray-300'}`}>
                                {isAnonymous ? <i className="fas fa-user-secret text-lg"></i> : (user?.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover"/> : <i className="fas fa-user text-lg"></i>)}
                            </div>
                            <span className="font-bold text-gray-800 text-lg">{isAnonymous ? "Anónimo" : user?.displayName}</span>
                        </div>
                        {/* Toggle Anónimo */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-500 uppercase">Anónimo</span>
                            <div className="relative inline-block w-10 mr-2 align-middle select-none">
                                <input type="checkbox" className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer border-gray-300" checked={isAnonymous} onChange={() => setIsAnonymous(!isAnonymous)} style={{right: isAnonymous ? '0' : 'auto', left: isAnonymous ? 'auto' : '0'}}/>
                                <div onClick={() => setIsAnonymous(!isAnonymous)} className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer ${isAnonymous ? 'bg-cyan-400' : 'bg-gray-300'}`}></div>
                            </div>
                        </div>
                    </div>

                    {/* ÁREA DE VIDEO (INPUT REAL) */}
                    <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden mb-4 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center group">
                        {videoPreview ? (
                            <video src={videoPreview} controls className="w-full h-full object-contain bg-black"></video>
                        ) : (
                            <div className="text-center p-4 pointer-events-none">
                                <i className="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-2"></i>
                                <p className="text-gray-500 text-sm font-medium">Toca para subir evidencia</p>
                                <p className="text-gray-400 text-xs mt-1">Video o Foto</p>
                            </div>
                        )}
                        
                        {/* Input invisible que cubre el área (solo si no hay video) */}
                        {!videoPreview && (
                            <input 
                                type="file" 
                                accept="video/*,image/*" 
                                onChange={handleFileSelect}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                        )}

                        {/* Botón para quitar video */}
                        {videoPreview && (
                            <button onClick={() => {setVideoPreview(null); setVideoFile(null)}} className="absolute top-2 right-2 bg-black/60 text-white p-2 rounded-full hover:bg-red-500 transition-colors z-20">
                                <i className="fas fa-times"></i>
                            </button>
                        )}
                    </div>

                    {/* Inputs Texto */}
                    <div className="flex flex-col gap-2 mb-6">
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="create-input text-xl font-bold text-gray-900 placeholder-gray-400 border-b border-transparent focus:border-gray-200 py-2" placeholder="Título de la incidencia..." />
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="create-input text-sm text-gray-700 leading-relaxed placeholder-gray-400 h-24 mt-2" placeholder="Describe qué está pasando..."></textarea>
                    </div>

                    {/* Footer y Botón Enviar */}
                    <div className="flex items-end justify-between border-t border-gray-100 pt-4">
                        <div className="flex items-center gap-1 text-xs font-medium text-gray-500">
                            <i className="fas fa-map-marker-alt text-red-500"></i> San Pedro Sula • {currentDate}
                        </div>

                        <button 
                            onClick={handleSubmit}
                            disabled={isUploading}
                            className={`bg-cyan-400 hover:bg-cyan-500 text-white font-bold py-2 px-6 rounded-full shadow-lg transition-all flex items-center gap-2 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isUploading ? (
                                <><i className="fas fa-spinner fa-spin"></i> Subiendo...</>
                            ) : (
                                <><i className="fas fa-paper-plane"></i> Publicar</>
                            )}
                        </button>
                    </div>
                </div>
            </main>
        </React.Fragment>
    );
}

const LoginView = ({ onNavigate, onLogin }) => (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden p-8 animate-fade-in">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-black text-cyan-500 mb-2">Bienvenido de nuevo</h2>
                <p className="text-gray-500">Ingresa para continuar monitoreando</p>
            </div>

            <div className="space-y-6">
                {/* Botón Principal de Google */}
                <button 
                    onClick={onLogin}
                    className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-100 hover:border-cyan-200 text-gray-700 font-semibold py-4 px-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 group"
                >
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-6 h-6 group-hover:scale-110 transition-transform" alt="Google" />
                    <span>Continuar con Google</span>
                </button>

                <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-gray-200"></div>
                    <span className="flex-shrink-0 mx-4 text-gray-300 text-xs">Acceso Seguro</span>
                    <div className="flex-grow border-t border-gray-200"></div>
                </div>

                <div className="text-center mt-6">
                    <p className="text-gray-500 text-sm">
                        ¿Aún no tienes cuenta?{" "}
                        <button onClick={() => onNavigate('register')} className="text-cyan-500 font-bold hover:underline">
                            Regístrate aquí
                        </button>
                    </p>
                </div>
            </div>
        </div>
        
        {/* Footer simple */}
        <div className="mt-8 text-white/80 text-xs text-center">
            <p>Monitoreo Electoral HN © 2025</p>
        </div>
    </div>
);

const RegisterView = ({ onNavigate, onRegister }) => (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden p-8 animate-fade-in">
            <div className="text-center mb-8">
                <div className="inline-block p-3 rounded-full bg-cyan-50 mb-4">
                    <i className="fas fa-users text-2xl text-cyan-500"></i>
                </div>
                <h2 className="text-3xl font-black text-gray-800 mb-2">Únete a la Voz Ciudadana</h2>
                <p className="text-gray-500 text-sm px-4">
                    Regístrate para reportar incidencias y validar la transparencia electoral.
                </p>
            </div>

            <div className="space-y-6">
                {/* Al ser OAuth, Register y Login hacen lo mismo técnicamente */}
                <button 
                    onClick={onRegister}
                    className="w-full bg-cyan-400 hover:bg-cyan-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-cyan-200/50 transform transition-all duration-300 hover:-translate-y-1 flex items-center justify-center gap-3"
                >
                    <div className="bg-white p-1 rounded-full">
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-4 h-4" alt="Google" />
                    </div>
                    <span>Registrarse con Google</span>
                </button>

                <p className="text-xs text-gray-400 text-center px-6 leading-relaxed">
                    Al registrarte, aceptas nuestros términos de servicio y política de privacidad. Tus datos están protegidos.
                </p>

                <div className="text-center pt-4 border-t border-gray-100">
                    <p className="text-gray-500 text-sm">
                        ¿Ya tienes una cuenta?{" "}
                        <button onClick={() => onNavigate('login')} className="text-cyan-500 font-bold hover:underline">
                            Inicia Sesión
                        </button>
                    </p>
                </div>
            </div>
        </div>
    </div>
);

const HomeView = ({ onNavigate, posts, isAuthenticated, user, onLogout }) => (
    <React.Fragment>
        <Header onNavigate={onNavigate} isAuthenticated={isAuthenticated} showHomeLink={false} user={user} onLogout={onLogout} />

        <main className="relative z-10 max-w-6xl mx-auto px-4 flex flex-col items-center gap-8">
            <div className="w-full bg-white rounded-3xl p-8 shadow-sm text-center max-w-4xl mx-auto mt-4">
                <h2 className="text-2xl md:text-3xl font-bold text-cyan-500 leading-snug tracking-wide">
                    TU VOZ CUENTA.<br />
                    COMPARTE INCIDENCIAS Y AYUDA A<br />
                    GARANTIZAR TRANSPARENCIA<br />
                    ELECTORAL
                </h2>
            </div>

            <button 
                onClick={() => onNavigate('create')}
                className="bg-cyan-400 hover:bg-cyan-500 text-white font-bold py-3 px-12 rounded-lg shadow-lg transform transition-transform hover:-translate-y-1"
            >
                Crear post
            </button>

            <div className="w-full bg-white rounded-3xl shadow-lg p-6 md:p-8 min-h-[600px]">
                <div className="flex flex-col md:flex-row items-center justify-between mb-8 pb-4 border-b border-gray-200 gap-4">
                    <button className="flex items-center gap-2 text-gray-600 font-semibold hover:text-cyan-500 transition-colors">
                        <i className="fas fa-filter text-lg"></i>
                        <span>Recientes</span>
                    </button>
                    <div className="flex-1 w-full md:max-w-md mx-4 relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <i className="fas fa-search text-lg"></i>
                        </div>
                        <input type="text" placeholder="Buscar" className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-cyan-200" />
                    </div>
                    <button 
                        onClick={() => onNavigate('profile')}
                        className="flex items-center gap-2 text-gray-600 font-semibold hover:text-cyan-500 transition-colors"
                    >
                        <i className="fas fa-user-circle text-xl"></i>
                        <span>Perfil</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                    {posts.map((post) => (
                        <PostCard key={post.id} {...post} showUserHeader={true} />
                    ))}
                </div>
                <div className="w-full text-right mt-4">
                    <a href="#" className="text-cyan-400 text-sm font-semibold hover:underline">Ver más...</a>
                </div>
            </div>
        </main>
    </React.Fragment>
);

// PROFILE VIEW MODIFICADA: Ahora pasa la función de eliminación
const ProfileView = ({ onNavigate, posts, isAuthenticated, userData, onLogout, onDelete }) => (
    <React.Fragment>
        <Header onNavigate={onNavigate} isAuthenticated={isAuthenticated} showHomeLink={true} user={userData} onLogout={onLogout} />
        <main className="relative z-10 max-w-6xl mx-auto px-4 flex flex-col items-center gap-8">
            <div className="w-full bg-white rounded-3xl shadow-lg p-6 md:p-12 min-h-[600px] flex flex-col">
                <div className="flex flex-col items-center justify-center mb-8">
                    <div className="w-24 h-24 rounded-full bg-gray-600 flex items-center justify-center text-white mb-3 overflow-hidden">
                        {userData?.photoURL ? (
                            <img src={userData.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <i className="fas fa-user text-5xl"></i>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <i className="fas fa-pen text-gray-500 text-sm"></i>
                        <h2 className="text-2xl font-bold text-gray-700">{userData?.displayName || "Usuario"}</h2>
                    </div>
                </div>
                <hr className="border-gray-300 w-full mb-8" />
                <h3 className="text-2xl font-semibold text-gray-600 mb-6">Mis Posts</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-8">
                    {posts.length > 0 ? posts.map((post) => (
                        <PostCard 
                            key={post.id} 
                            {...post} 
                            showUserHeader={false} 
                            showDeleteAction={true} // <-- Hacemos visible el botón
                            postId={post.id} // <-- Pasamos el ID del documento
                            onDelete={onDelete} // <-- Pasamos la función de eliminar
                        />
                    )) : (
                        <div className="md:col-span-3 text-center py-10 text-gray-500">
                            <p>Aún no has subido ningún post. ¡Comparte tu primera incidencia!</p>
                        </div>
                    )}
                </div>
                <div className="mt-12 flex justify-center">
                    <button 
                        onClick={() => onNavigate('create')}
                        className="w-16 h-16 bg-cyan-400 hover:bg-cyan-500 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105"
                    >
                        <i className="fas fa-plus text-white text-3xl font-light"></i>
                    </button>
                </div>
            </div>
        </main>
    </React.Fragment>
);

// --- MÓDULO PRINCIPAL DE LA APLICACIÓN ---
const App = () => {
    const [view, setView] = useState('home'); // 'home' | 'profile' | 'login' | 'register' | 'create'
    const [user, setUser] = useState(null); // Guardamos el objeto usuario real
    const [isLoading, setIsLoading] = useState(true); // Para esperar a verificar sesión
    const [allPosts, setAllPosts] = useState([]); // Posts desde Firebase
    
    // 1. EFECTO: Escuchar si el usuario ya está logueado (persistencia de sesión)
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // El usuario está logueado, obtenemos sus datos extras de la BD si existen
                const userDocRef = doc(db, "users", firebaseUser.uid);
                const userDoc = await getDoc(userDocRef);
                
                if (userDoc.exists()) {
                    setUser({ ...firebaseUser, ...userDoc.data() });
                } else {
                    setUser(firebaseUser);
                }
            } else {
                setUser(null);
            }
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // 2. EFECTO: Cargar posts desde Firebase (onSnapshot asegura la actualización reactiva)
    useEffect(() => {
        const postsRef = collection(db, "posts");
        const q = query(postsRef, orderBy("createdAt", "desc"));
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const posts = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                posts.push({
                    id: doc.id, // <-- ID DEL DOCUMENTO ES CRÍTICO
                    user: data.userName,
                    avatar: data.userAvatar,
                    thumbnail: data.thumbnail,
                    mediaType: data.mediaType,
                    title: data.title,
                    description: data.description,
                    location: data.location,
                    time: data.time,
                    userId: data.userId // <-- ¡IMPORTANTE! Necesario para el filtro
                });
            });
            setAllPosts(posts);
        });

        return () => unsubscribe();
    }, []);

    // 3. FUNCIÓN: Iniciar sesión con Google (Sin cambios)
    const handleGoogleLogin = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            // Guardar usuario en Base de Datos (Firestore)
            const userRef = doc(db, "users", user.uid);
            await setDoc(userRef, {
                uid: user.uid,
                displayName: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
                lastLogin: new Date().toISOString()
            }, { merge: true });

            setView('home');
        } catch (error) {
            console.error("Error al iniciar sesión:", error);
            alert("Error de autenticación: " + error.message);
        }
    };

    // 4. FUNCIÓN: Cerrar Sesión (Sin cambios)
    const handleLogout = async () => {
        await signOut(auth);
        setView('login');
    };

    // 5. FUNCIÓN: Crear Post (Sin cambios)
    const handleCreatePost = async (postData) => {
        if (!user) return alert("Debes iniciar sesión");
        
        try {            
            // A) Subir Video a Storage
            const fileName = `posts/${Date.now()}_${postData.file.name}`;
            const storageRef = ref(storage, fileName);
            
            const snapshot = await uploadBytes(storageRef,  postData.file);
            
            const downloadURL = await getDownloadURL(snapshot.ref);

            // B) Guardar datos en Firestore
            const postsRef = collection(db, "posts");
            await addDoc(postsRef, {
                title: postData.title,
                description: postData.description,
                isAnonymous: postData.isAnonymous,
                userId: user.uid, // <-- Guardamos el UID para verificar propiedad
                userName: postData.isAnonymous ? "Anónimo" : user.displayName,
                userAvatar: postData.isAnonymous ? null : user.photoURL,
                thumbnail: downloadURL,
                mediaType: postData.file.type.startsWith('video') ? 'video' : 'image',
                location: "San Pedro Sula",
                time: createdAt.toLocaleString('es-ES', { 
                    month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                }),
                createdAt: createdAt.toISOString(),
                views: 0
            });

            setView('home');
        } catch (error) {
            console.error("Error al crear post:", error);
            alert("Error al subir el post: " + error.message);
        }
    };
    
    // 6. FUNCIÓN: Eliminar Post (¡NUEVA!)
    const handleDeletePost = async (postId) => {
        if (!user) return alert("Error de autenticación. No se puede eliminar.");

        // Confirmación
        if (!window.confirm("¿Estás seguro de que quieres eliminar este post? Esta acción es irreversible.")) {
            return;
        }

        try {
            // Usamos deleteDoc para eliminar el documento
            await deleteDoc(doc(db, "posts", postId));

            // onSnapshot se encarga de actualizar la interfaz (quitarlo de la página)
            alert("Post eliminado con éxito.");

        } catch (error) {
            console.error("Error al eliminar post:", error);
            alert("Error al intentar eliminar el post: " + error.message);
        }
    };

    // Filtrar posts del usuario para la vista de perfil (¡Mejora de seguridad!)
    const profilePosts = allPosts.filter(post => 
        post.userId === user?.uid 
    );

    // Renderizado condicional
    const renderView = () => {
        if (isLoading) return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando...</p>
                </div>
            </div>
        );

        switch(view) {
            case 'create': 
                return <CreatePostView onNavigate={setView} onPostCreate={handleCreatePost} isAuthenticated={!!user} user={user} onLogout={handleLogout} />;
            case 'profile': 
                return (
                    <ProfileView 
                        onNavigate={setView} 
                        posts={profilePosts} 
                        isAuthenticated={!!user} 
                        userData={user} 
                        onLogout={handleLogout} 
                        onDelete={handleDeletePost} // <-- PASAMOS LA FUNCIÓN DE ELIMINAR
                    />
                );
            case 'login': 
                return <LoginView onNavigate={setView} onLogin={handleGoogleLogin} />;
            case 'register': 
                return <RegisterView onNavigate={setView} onRegister={handleGoogleLogin} />;
            default: 
                return <HomeView onNavigate={setView} posts={allPosts} isAuthenticated={!!user} user={user} onLogout={handleLogout} />;
        }
    };

    return (
        <div className="min-h-screen relative font-sans text-slate-800 pb-20 flex flex-col justify-between">
            
            {/* Fondo Decorativo (Confetti) - Constante en todas las vistas */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0 fixed">
                <div className="absolute top-20 left-10 w-4 h-4 rounded-full bg-slate-300 opacity-60"></div>
                <div className="absolute top-40 left-32 w-2 h-2 rounded-full bg-slate-400 opacity-50"></div>
                <div className="absolute top-24 right-20 w-6 h-6 rounded-full bg-slate-200 opacity-70"></div>
                <div className="absolute top-10 right-48 w-3 h-3 rounded-full bg-slate-300 opacity-50"></div>
                <div className="absolute bottom-1/3 left-10 w-8 h-8 rounded-full bg-slate-200 opacity-40"></div>
                <div className="absolute top-1/2 right-10 w-5 h-5 rounded-full bg-slate-300 opacity-60"></div>
                <div className="absolute bottom-20 right-1/4 w-6 h-6 rounded-full bg-slate-300 opacity-50"></div>
            </div>

            <div className="z-20">
                {renderView()}
            </div>

            {/* Footer constante - Siempre visible */}
            <footer className="relative z-10 max-w-7xl mx-auto px-6 py-12 mt-8 flex flex-col md:flex-row justify-between items-center text-gray-500 text-sm w-full">
                <span>Elecciones 2025</span>
                
                <div className="flex flex-col items-center leading-none my-4 md:my-0 cursor-pointer group" onClick={() => setView('home')}>
                    <h2 className="text-2xl font-black text-cyan-400 tracking-tight group-hover:opacity-80 transition-opacity">Monitoreo</h2>
                    <div className="flex items-center gap-1">
                        <span className="text-lg font-bold text-cyan-500 group-hover:opacity-80 transition-opacity">ELECTORAL</span>
                        <span className="text-xs font-light text-gray-500 tracking-widest">HN</span>
                    </div>
                </div>

                <span>Honduras</span>
            </footer>

        </div>
    );
};

// Renderizar la aplicación
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);