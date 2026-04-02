import { 
  getAuth, 
  signInWithPhoneNumber,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  RecaptchaVerifier,
  updateProfile,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User,
  ConfirmationResult
} from 'firebase/auth';
import { app } from '../firebase';

export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// 手机号登录 - 发送验证码
export const sendPhoneCode = async (
  phoneNumber: string, 
  recaptchaVerifier: RecaptchaVerifier
): Promise<ConfirmationResult> => {
  return await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
};

// 手机号登录 - 验证验证码
export const verifyPhoneCode = async (
  confirmationResult: ConfirmationResult, 
  code: string
): Promise<User> => {
  const result = await confirmationResult.confirm(code);
  return result.user;
};

// 邮箱登录
export const loginWithEmail = async (email: string, password: string): Promise<User> => {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
};

// 邮箱注册
export const registerWithEmail = async (
  email: string, 
  password: string, 
  name: string
): Promise<User> => {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(result.user, { displayName: name });
  return result.user;
};

// Google 登录
export const loginWithGoogle = async (): Promise<User> => {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
};

// 重置密码
export const resetPassword = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email);
};

// 登出
export const logout = async (): Promise<void> => {
  await auth.signOut();
};

// 监听登录状态
export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// 创建 reCAPTCHA 验证器
export const createRecaptchaVerifier = (containerId: string): RecaptchaVerifier => {
  return new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA solved
    },
  });
};
