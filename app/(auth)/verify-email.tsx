import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSignUp } from "@clerk/clerk-expo";
import { useRouter, useLocalSearchParams } from "expo-router";

function maskEmail(email: string): string {
  const atIndex = email.indexOf("@");
  if (atIndex < 0) return email;
  const local = email.slice(0, atIndex);
  const domain = email.slice(atIndex);
  return `${local.slice(0, 2)}***${domain}`;
}

type BannerError = "wrong_code" | "expired" | "too_many" | "resend_failed";

const BANNER_MESSAGES: Record<BannerError, string> = {
  wrong_code: "Código incorrecto. Verifica tu email e intenta de nuevo.",
  expired: "El código expiró. Solicita uno nuevo.",
  too_many: "Demasiados intentos. Solicita un nuevo código.",
  resend_failed: "No se pudo reenviar el código. Intenta de nuevo.",
};

export default function VerifyEmailScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [bannerError, setBannerError] = useState<BannerError | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(30);
  const [loading, setLoading] = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const isBlocked = failedAttempts >= 3;
  const fullCode = code.join("");

  const handleCodeChange = (value: string, index: number) => {
    if (isBlocked) return;
    const digit = value.replace(/\D/g, "").slice(-1);
    const updated = [...code];
    updated[index] = digit;
    setCode(updated);
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (
    e: { nativeEvent: { key: string } },
    index: number,
  ) => {
    if (e.nativeEvent.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    if (isBlocked || fullCode.length < 6 || !isLoaded) return;

    setLoading(true);
    setBannerError(null);
    try {
      await signUp.attemptEmailAddressVerification({ code: fullCode });
      if (signUp.status === "complete") {
        await setActive({ session: signUp.createdSessionId });
        router.replace("/(tabs)");
      } else {
        router.replace("/onboarding");
      }
    } catch (err: any) {
      const clerkCode: string = err?.errors?.[0]?.code ?? "";
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      setCode(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);

      if (newAttempts >= 3) {
        setBannerError("too_many");
      } else if (
        clerkCode === "verification_expired" ||
        clerkCode === "form_code_incorrect_expiration"
      ) {
        setBannerError("expired");
      } else {
        setBannerError("wrong_code");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !isLoaded) return;
    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setResendCooldown(30);
      setFailedAttempts(0);
      setBannerError(null);
      setCode(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } catch {
      setBannerError("resend_failed");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>Verifica tu email</Text>
        <Text style={styles.subtitle}>
          Enviamos un código a {email ? maskEmail(email) : "tu correo"}
        </Text>

        {bannerError && (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>
              {BANNER_MESSAGES[bannerError]}
            </Text>
          </View>
        )}

        <View style={styles.codeRow}>
          {code.map((digit, i) => (
            <TextInput
              key={i}
              ref={(ref) => {
                inputRefs.current[i] = ref;
              }}
              style={[
                styles.codeInput,
                isBlocked ? styles.codeInputDisabled : null,
              ]}
              value={digit}
              onChangeText={(val) => handleCodeChange(val, i)}
              onKeyPress={(e) => handleKeyPress(e, i)}
              keyboardType="number-pad"
              maxLength={1}
              editable={!isBlocked && !loading}
              selectTextOnFocus
            />
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            fullCode.length < 6 || isBlocked ? styles.buttonDisabled : null,
          ]}
          onPress={handleVerify}
          disabled={fullCode.length < 6 || isBlocked || loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Verificando..." : "Verificar"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resendButton}
          onPress={handleResend}
          disabled={resendCooldown > 0}
        >
          <Text
            style={[
              styles.resendText,
              resendCooldown > 0 ? styles.resendDisabled : null,
            ]}
          >
            {resendCooldown > 0
              ? `Reenviar (${resendCooldown}s)`
              : "Reenviar código"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  inner: { flex: 1, padding: 24, justifyContent: "center" },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 8, color: "#111" },
  subtitle: { fontSize: 15, color: "#6b7280", marginBottom: 24 },
  banner: {
    backgroundColor: "#fee2e2",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#fca5a5",
  },
  bannerText: { color: "#b91c1c", fontSize: 14 },
  codeRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  codeInput: {
    flex: 1,
    aspectRatio: 1,
    borderWidth: 1.5,
    borderColor: "#d1d5db",
    borderRadius: 8,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "600",
    color: "#111",
    backgroundColor: "#f9fafb",
  },
  codeInputDisabled: { opacity: 0.4, backgroundColor: "#e5e7eb" },
  button: {
    backgroundColor: "#0a7ea4",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginBottom: 16,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  resendButton: { alignItems: "center" },
  resendText: { color: "#0a7ea4", fontSize: 15, fontWeight: "500" },
  resendDisabled: { color: "#9ca3af" },
});
