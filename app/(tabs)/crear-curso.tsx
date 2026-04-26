import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SelectInput } from '@/components/ui/select-input';
import { InterestPicker } from '@/components/ui/interest-picker';
import { ACADEMIC_LEVELS, MODALIDADES, INTERESTS } from '@/constants/registration-options';
import { useTutorCourses } from '@/hooks/use-tutor-courses';

type Duration = 30 | 60 | 90;

interface CertFile { id: string; name: string; uri: string; mimeType: string; }

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function CrearCursoScreen() {
  const router = useRouter();
  const { create, update } = useTutorCourses();
  const params = useLocalSearchParams<{
    courseId?: string;
    subject?: string;
    price?: string;
    duration?: string;
    modalidad?: string;
    level?: string;
    description?: string;
  }>();

  const isEditing = !!params.courseId;

  const [subject, setSubject] = useState<string[]>(params.subject ? [params.subject] : []);
  const [description, setDescription] = useState(params.description ?? '');
  const [price, setPrice] = useState(params.price ?? '');
  const [duration, setDuration] = useState<Duration>((Number(params.duration) as Duration) || 60);
  const [modalidad, setModalidad] = useState(params.modalidad ?? '');
  const [level, setLevel] = useState(params.level ?? '');
  const [certs, setCerts] = useState<CertFile[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const errors = {
    subject: submitted && subject.length === 0,
    price: submitted && (!price || Number(price) <= 0),
    modalidad: submitted && !modalidad,
  };

  const canSubmit = subject.length > 0 && !!price && Number(price) > 0 && !!modalidad;

  const pickFile = async () => {
    if (certs.length >= 5) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ALLOWED_TYPES, copyToCacheDirectory: true });
      if (result.canceled) return;
      const file = result.assets[0];
      if (!ALLOWED_TYPES.includes(file.mimeType ?? '')) { alert('Solo PDF, JPG o PNG.'); return; }
      if (file.size && file.size > MAX_FILE_SIZE) { alert('El archivo excede 5 MB.'); return; }
      setCerts((p) => [...p, { id: Date.now().toString(), name: file.name, uri: file.uri, mimeType: file.mimeType ?? '' }]);
    } catch {}
  };

  const handleCreate = async () => {
    setSubmitted(true);
    setSaveError(null);
    if (!canSubmit) return;
    setLoading(true);

    const payload = {
      subject: subject[0],
      description: description.trim() || undefined,
      price: Number(price),
      duration,
      modalidad,
      academicLevel: level || undefined,
    };

    let ok: boolean;
    if (isEditing && params.courseId) {
      ok = await update(params.courseId, payload);
    } else {
      ok = !!(await create(payload));
    }

    setLoading(false);
    if (!ok) {
      setSaveError('No se pudo guardar el curso. Verifica tu conexión e intenta de nuevo.');
      return;
    }
    router.back();
  };

  return (
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
          <TouchableOpacity onPress={() => router.back()} className="p-1">
            <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
          </TouchableOpacity>
          <Text className="text-base font-semibold text-text-primary">
            {isEditing ? 'Editar curso' : 'Nuevo curso'}
          </Text>
          <View className="w-8" />
        </View>

        <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
          <View className="pt-4 pb-5">
            <Text className="text-2xl font-bold text-text-primary mb-1">
              {isEditing ? 'Editar curso' : 'Crea tu curso'}
            </Text>
            <Text className="text-sm text-text-muted">Cada curso tiene su propio precio, duración y certificaciones.</Text>
          </View>

          {saveError && (
            <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
              <Text className="text-red-700 text-sm">{saveError}</Text>
            </View>
          )}

          {/* Subject */}
          <Text className="text-xs font-semibold text-text-muted mb-2 uppercase tracking-wide">
            Materia / Tema {errors.subject && <Text className="text-red-400 normal-case">— requerido</Text>}
          </Text>
          <View className="mb-4">
            <InterestPicker
              predefinedOptions={INTERESTS}
              selected={subject}
              onAdd={(s) => subject.length === 0 && setSubject([s])}
              onRemove={() => setSubject([])}
              hasError={errors.subject}
            />
            {subject.length > 0 && (
              <Text className="text-xs text-text-muted mt-1">Un solo tema por curso. Para otro tema, crea un nuevo curso.</Text>
            )}
          </View>

          {/* Description */}
          <Text className="text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">
            Descripción <Text className="font-normal normal-case">(opcional)</Text>
          </Text>
          <TextInput
            className="bg-white border border-border rounded-xl px-4 py-3 text-base text-text-primary mb-4"
            placeholder="¿Qué aprenderán los estudiantes en este curso?"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            value={description}
            onChangeText={setDescription}
            style={{ minHeight: 80 }}
          />

          {/* Price + Duration */}
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Text className="text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">
                Precio {errors.price && <Text className="text-red-400 normal-case">— requerido</Text>}
              </Text>
              <View className={`flex-row items-center bg-white border rounded-xl px-3 ${errors.price ? 'border-red-400' : 'border-border'}`}>
                <Text className="text-text-muted mr-1">$</Text>
                <TextInput
                  className="flex-1 py-3 text-base text-text-primary"
                  placeholder="50.000"
                  keyboardType="numeric"
                  value={price}
                  onChangeText={setPrice}
                />
                <Text className="text-text-muted text-xs">COP</Text>
              </View>
            </View>
            <View className="flex-1">
              <Text className="text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">Duración</Text>
              <View className="flex-row gap-1.5">
                {([30, 60, 90] as Duration[]).map((d) => (
                  <TouchableOpacity key={d} onPress={() => setDuration(d)}
                    className={`flex-1 py-3 rounded-xl border items-center ${duration === d ? 'bg-primary border-primary' : 'bg-white border-border'}`}>
                    <Text className={`text-xs font-semibold ${duration === d ? 'text-white' : 'text-text-muted'}`}>{d}m</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Modalidad */}
          <Text className="text-xs font-semibold text-text-muted mb-2 uppercase tracking-wide">
            Modalidad {errors.modalidad && <Text className="text-red-400 normal-case">— requerido</Text>}
          </Text>
          <View className="flex-row gap-2 mb-4">
            {MODALIDADES.map((m) => (
              <TouchableOpacity key={m} onPress={() => setModalidad(m)}
                className={`flex-1 py-3 rounded-xl border items-center ${modalidad === m ? 'bg-primary border-primary' : 'bg-white border-border'}`}>
                <Text className={`text-xs font-semibold ${modalidad === m ? 'text-white' : 'text-text-muted'}`}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Academic level */}
          <Text className="text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">
            Nivel académico requerido <Text className="font-normal normal-case">(opcional)</Text>
          </Text>
          <View className="mb-4">
            <SelectInput options={ACADEMIC_LEVELS} value={level} onChange={setLevel} placeholder="Cualquier nivel" />
          </View>

          {/* Certifications */}
          <Text className="text-xs font-semibold text-text-muted mb-2 uppercase tracking-wide">
            Certificaciones de este curso <Text className="font-normal normal-case">(opcional · máx. 5)</Text>
          </Text>
          <TouchableOpacity onPress={pickFile} disabled={certs.length >= 5} activeOpacity={0.85}
            className={`border-2 border-dashed rounded-2xl py-5 px-4 items-center mb-3 ${certs.length >= 5 ? 'border-gray-200 bg-gray-50' : 'border-primary/40 bg-primary/5'}`}>
            <MaterialCommunityIcons name="cloud-upload-outline" size={26} color={certs.length >= 5 ? '#9CA3AF' : '#006A75'} />
            <Text className={`text-sm font-semibold mt-1.5 ${certs.length >= 5 ? 'text-gray-400' : 'text-primary'}`}>
              {certs.length >= 5 ? 'Límite alcanzado' : 'Adjuntar certificado'}
            </Text>
            <Text className="text-xs text-text-muted mt-0.5">PDF, JPG o PNG · máx. 5 MB</Text>
          </TouchableOpacity>

          {certs.map((c) => (
            <View key={c.id} className="flex-row items-center gap-3 bg-white border border-border rounded-xl px-3 py-2.5 mb-2">
              <MaterialCommunityIcons name={c.mimeType === 'application/pdf' ? 'file-pdf-box' : 'image'} size={20} color="#006A75" />
              <Text className="flex-1 text-sm text-text-primary" numberOfLines={1}>{c.name}</Text>
              <TouchableOpacity onPress={() => setCerts((p) => p.filter((x) => x.id !== c.id))}>
                <Ionicons name="close" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          ))}

          <View className="mt-4">
            <TouchableOpacity onPress={handleCreate} disabled={loading} activeOpacity={0.85}
              className={`rounded-full py-4 items-center flex-row justify-center gap-2 ${canSubmit ? 'bg-primary' : 'bg-gray-200'}`}>
              {loading ? <ActivityIndicator color="white" /> : (
                <Text className={`text-base font-semibold ${canSubmit ? 'text-white' : 'text-gray-400'}`}>
                  {isEditing ? 'Guardar cambios' : 'Publicar curso'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
