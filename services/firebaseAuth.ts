// Firebase Authentication service
// Используем Email/Password авторизацию для работы с правилами безопасности
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { app } from "../firebase/config";

const auth = getAuth(app);

// Администраторский аккаунт для Firebase Auth (отдельно от пользователей приложения)
// Эти данные используются ТОЛЬКО для авторизации в Firebase, НЕ для входа в приложение
// Пользователи приложения используют кастомную авторизацию (логин/пароль из Firestore)
// Можно использовать любой email, даже несуществующий - это технический аккаунт
const ADMIN_EMAIL = 'firebase-admin@tipa-task-manager.com';
const ADMIN_PASSWORD = 'FirebaseAdmin2024!'; // Измените на более безопасный пароль

/**
 * Инициализация авторизации администратора
 * Вызывается при старте приложения
 */
export const initFirebaseAuth = async (): Promise<FirebaseUser | null> => {
  try {
    // Проверяем, авторизован ли уже пользователь
    if (auth.currentUser) {
      return auth.currentUser;
    }

    // Пытаемся войти с администраторскими данными
    try {
      const userCredential = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
      return userCredential.user;
    } catch (error: any) {
      // Если пользователь не существует, создаем его
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        const userCredential = await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
        return userCredential.user;
      }
      throw error;
    }
  } catch (error) {
    // Firebase Auth Error
    // Продолжаем работу даже при ошибке авторизации
    return null;
  }
};

/**
 * Получить текущего авторизованного пользователя
 */
export const getCurrentFirebaseUser = (): FirebaseUser | null => {
  return auth.currentUser;
};

/**
 * Проверить, авторизован ли пользователь
 */
export const isAuthenticated = (): boolean => {
  return auth.currentUser !== null;
};

/**
 * Подписаться на изменения состояния авторизации
 */
export const onAuthStateChange = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

