import { API_ENDPOINTS } from '@/constants/api';
import { useApiRequest } from '@/services/api';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILES = 10;
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const TOTAL_STEPS = 4;

interface CertificationFile {
  id: string;
  name: string;
  size: number;
  uri: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  mimeType: string;
  imagePreview?: string;
  errorMessage?: string;
}

// ── File status badge ─────────────────────────────────────────────────────────

function FileStatusBadge({
  file,
  onRetry,
}: {
  file: CertificationFile;
  onRetry: (id: string) => void;
}) {
  if (file.status === 'uploading') {
    return (
      <View className="flex-row items-center gap-2 mt-2">
        <ActivityIndicator size="small" color="#006A75" />
        <Text className="text-xs text-text-muted">Subiendo...</Text>
      </View>
    );
  }
  if (file.status === 'success') {
    return (
      <View className="flex-row items-center gap-1.5 mt-2">
        <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
        <Text className="text-xs text-green-600 font-medium">Subido correctamente</Text>
      </View>
    );
  }
  if (file.status === 'error') {
    return (
      <View className="mt-2">
        <View className="flex-row items-center gap-1.5 mb-2">
          <Ionicons name="close-circle" size={16} color="#ef4444" />
          <Text className="text-xs text-red-600 flex-1">
            {file.errorMessage ?? 'Error al subir. Intenta de nuevo.'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => onRetry(file.id)}
          className="self-start bg-primary/10 rounded-lg px-3 py-1.5"
        >
          <Text className="text-primary text-xs font-semibold">Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }
  return null;
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function TutorCertificationsScreen() {
  const router = useRouter();
  const { get } = useApiRequest();
  useLocalSearchParams<{ tutorId: string }>();

  const [certifications, setCertifications] = useState<CertificationFile[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const successCount = certifications.filter((c) => c.status === 'success').length;
  const isAtLimit = certifications.length >= MAX_FILES;
  const canSubmit = successCount > 0 && !submitting;

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round((bytes / Math.pow(1024, i)) * 100) / 100} ${units[i]}`;
  };

  const handlePickDocument = async () => {
    if (isAtLimit) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ALLOWED_TYPES,
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;

      const file = result.assets[0];
      const mimeType = file.mimeType ?? '';

      if (!ALLOWED_TYPES.includes(mimeType)) {
        alert('Tipo de archivo no permitido. Solo PDF, JPG o PNG.');
        return;
      }
      if (file.size && file.size > MAX_FILE_SIZE) {
        alert('El archivo excede 5 MB. Selecciona un archivo más pequeño.');
        return;
      }

      setCertifications((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          name: file.name,
          size: file.size ?? 0,
          uri: file.uri,
          status: 'pending',
          mimeType,
          imagePreview: mimeType.startsWith('image/') ? file.uri : undefined,
        },
      ]);
    } catch {
      // Picker dismissed — no action needed
    }
  };

  const uploadFile = async (file: CertificationFile) => {
    setCertifications((prev) =>
      prev.map((f) => (f.id === file.id ? { ...f, status: 'uploading' as const } : f)),
    );
    try {
      // 1. Get presigned POST URL from backend
      const { data: presigned } = await get(
        API_ENDPOINTS.certificationUploadUrl(file.mimeType, file.name),
      );
      const { url, fields } = presigned as { url: string; fields: Record<string, string> };

      // 2. Upload directly to S3
      const s3Form = new FormData();
      Object.entries(fields).forEach(([k, v]) => s3Form.append(k, v));
      s3Form.append('file', { uri: file.uri, name: file.name, type: file.mimeType } as any);

      const s3Response = await fetch(url, { method: 'POST', body: s3Form });

      if (s3Response.ok || s3Response.status === 204) {
        setCertifications((prev) =>
          prev.map((f) => (f.id === file.id ? { ...f, status: 'success' as const } : f)),
        );
      } else {
        throw new Error(`S3 upload failed: ${s3Response.status}`);
      }
    } catch {
      setCertifications((prev) =>
        prev.map((f) =>
          f.id === file.id
            ? { ...f, status: 'error' as const, errorMessage: 'Sin conexión. Intenta de nuevo.' }
            : f,
        ),
      );
    }
  };

  useEffect(() => {
    const pending = certifications.filter((f) => f.status === 'pending');
    const uploading = certifications.filter((f) => f.status === 'uploading');
    if (pending.length > 0 && uploading.length < 3) {
      uploadFile(pending[0]);
    }
  }, [certifications]);

  const handleRetry = (id: string) =>
    setCertifications((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, status: 'pending' as const, errorMessage: undefined } : f,
      ),
    );

  const handleRemove = (id: string) =>
    setCertifications((prev) => prev.filter((f) => f.id !== id));

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      router.push('/(auth)/tutor-primer-curso' as any);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => router.push('/(auth)/tutor-primer-curso' as any);

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-3.5">
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color="#1A2E35" />
        </TouchableOpacity>
        <Text className="text-base font-bold text-text-primary">Registro de Tutor</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Step dots — step 3 of 4 is active */}
      <View className="flex-row justify-center gap-2 mb-2">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <View
            key={i}
            className={`h-2 rounded-full ${i + 1 < TOTAL_STEPS ? 'bg-primary' : 'bg-border'}`}
            style={{ width: i + 1 === TOTAL_STEPS - 1 ? 28 : 8 }}
          />
        ))}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
        className="flex-1"
      >
        {/* Title */}
        <View className="px-5 mt-4 mb-6">
          <Text className="text-3xl font-extrabold text-text-primary mb-2">Certificaciones</Text>
          <Text className="text-sm text-text-muted leading-5">
            Paso 3 de 4: Sube tus diplomas o certificados para verificar tu perfil.
          </Text>
        </View>

        {/* Upload box */}
        <View className="px-5 mb-6">
          <Text className="text-sm font-bold text-text-primary mb-3">Subir Certificaciones</Text>
          <TouchableOpacity
            onPress={handlePickDocument}
            disabled={isAtLimit}
            activeOpacity={0.8}
            className={`rounded-2xl border-2 border-dashed items-center py-8 px-5 gap-2 ${
              isAtLimit ? 'border-red-300 bg-red-50' : 'border-primary bg-primary/5'
            }`}
          >
            <MaterialCommunityIcons
              name="cloud-upload-outline"
              size={40}
              color={isAtLimit ? '#ef4444' : '#006A75'}
            />
            <Text
              className={`text-base font-bold mt-1 ${
                isAtLimit ? 'text-red-600' : 'text-text-primary'
              }`}
            >
              {isAtLimit ? 'Límite de archivos alcanzado' : 'Adjuntar archivos'}
            </Text>
            <Text className="text-xs text-text-muted text-center">
              Sube tus diplomas o certificados (PDF, JPG o PNG · máx. 5 MB)
            </Text>
            {!isAtLimit && (
              <View className="mt-3 bg-primary rounded-xl px-6 py-2.5">
                <Text className="text-sm font-bold text-primary-foreground">
                  Seleccionar archivos
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* File list */}
        {certifications.length > 0 && (
          <View className="px-5 mb-4">
            <Text className="text-sm font-bold text-text-primary mb-3">
              {certifications.length} archivo{certifications.length !== 1 ? 's' : ''}
              {successCount > 0 && (
                <Text className="font-normal text-green-600">
                  {' '}· {successCount} subido{successCount !== 1 ? 's' : ''}
                </Text>
              )}
            </Text>

            {certifications.map((file) => (
              <View
                key={file.id}
                className="bg-white rounded-2xl p-4 mb-3 border border-border"
                style={{ elevation: 1 }}
              >
                <View className="flex-row items-start gap-3">
                  {/* Thumbnail */}
                  {file.mimeType === 'application/pdf' ? (
                    <View className="w-12 h-12 rounded-xl bg-red-50 items-center justify-center flex-shrink-0">
                      <MaterialCommunityIcons name="file-pdf-box" size={28} color="#dc2626" />
                    </View>
                  ) : file.imagePreview ? (
                    <Image
                      source={{ uri: file.imagePreview }}
                      className="w-12 h-12 rounded-xl flex-shrink-0"
                    />
                  ) : (
                    <View className="w-12 h-12 rounded-xl bg-gray-100 items-center justify-center flex-shrink-0">
                      <MaterialCommunityIcons name="image" size={28} color="#999" />
                    </View>
                  )}

                  {/* Info */}
                  <View className="flex-1 min-w-0">
                    <Text className="text-sm font-semibold text-text-primary" numberOfLines={1}>
                      {file.name}
                    </Text>
                    <Text className="text-xs text-text-muted mt-0.5">{formatSize(file.size)}</Text>
                    <FileStatusBadge file={file} onRetry={handleRetry} />
                  </View>

                  {/* Remove */}
                  {file.status !== 'uploading' && (
                    <TouchableOpacity
                      onPress={() => handleRemove(file.id)}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      className="flex-shrink-0"
                    >
                      <Ionicons name="close-circle-outline" size={22} color="#A0B0B8" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Submit */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!canSubmit}
          activeOpacity={0.85}
          className={`mx-5 rounded-2xl py-4 items-center ${
            canSubmit ? 'bg-primary' : 'bg-secondary opacity-50'
          }`}
        >
          <Text
            className={`text-base font-bold ${
              canSubmit ? 'text-primary-foreground' : 'text-text-muted'
            }`}
          >
            {submitting ? 'Enviando...' : 'Enviar solicitud →'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSkip} className="items-center mt-4">
          <Text className="text-sm font-semibold text-primary">Omitir por ahora</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
