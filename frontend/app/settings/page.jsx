'use client';
import { useEffect, useState } from 'react';
import { userApi, chatApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import { useRequireAuth } from '../../hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { getErrorMessage } from '../../lib/utils';
import toast from 'react-hot-toast';
import {
  User,
  Mail,
  Pencil,
  Target,
  Dumbbell,
  Weight,
  Ruler,
  CalendarDays,
  Timer,
  Send,
  LinkIcon,
  Link2Off,
  CheckCircle2,
  Trash2,
  MessageSquare,
  ChevronRight,
} from 'lucide-react';

export default function SettingsPage() {
  const { isAuthenticated } = useRequireAuth();
  const { user, setUser } = useAuthStore();
  const { clearMessages } = useChatStore();
  const [goal, setGoal] = useState(null);
  const [name, setName] = useState(user?.name ?? '');
  const [telegramId, setTelegramId] = useState('');
  const [saving, setSaving] = useState(false);
  const [linkingTg, setLinkingTg] = useState(false);
  const [unlinkingTg, setUnlinkingTg] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    userApi.getFitnessGoal()
      .then((res) => setGoal(res.data.data))
      .catch(() => {});
  }, [isAuthenticated]);

  const updateName = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await userApi.updateMe({ name });
      setUser({ ...user, name: res.data.data.name });
      toast.success('Name updated');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const linkTelegram = async () => {
    if (!telegramId.trim()) return;
    setLinkingTg(true);
    try {
      await userApi.linkTelegram(telegramId.trim());
      setUser({ ...user, telegramId: telegramId.trim() });
      toast.success('Telegram linked!');
      setTelegramId('');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLinkingTg(false);
    }
  };

  const unlinkTelegram = async () => {
    setUnlinkingTg(true);
    try {
      await userApi.unlinkTelegram();
      setUser({ ...user, telegramId: null });
      toast.success('Telegram unlinked');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUnlinkingTg(false);
    }
  };

  const clearChat = async () => {
    try {
      await chatApi.clearHistory();
      clearMessages();
      toast.success('Chat history cleared');
    } catch {
      toast.error('Failed to clear history');
    }
  };

  const goalStats = goal
    ? [
        { icon: Target, label: 'Goal', value: goal.goal.replace(/_/g, ' ') },
        { icon: Dumbbell, label: 'Experience', value: goal.experienceLevel },
        { icon: Weight, label: 'Weight', value: `${goal.weightKg} kg` },
        { icon: Ruler, label: 'Height', value: `${goal.heightCm} cm` },
        { icon: CalendarDays, label: 'Training Days', value: `${goal.daysPerWeek} / week` },
        { icon: Timer, label: 'Session Length', value: `${goal.sessionMinutes} min` },
      ]
    : [];

  if (!isAuthenticated) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-1">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50">
          <User className="h-5 w-5 text-brand-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-500" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Mail className="h-4 w-4 shrink-0" />
            {user?.email}
          </div>
          <Button size="sm" loading={saving} onClick={updateName}>
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            Save Name
          </Button>
        </CardContent>
      </Card>

      {/* Fitness Profile */}
      {goal && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-gray-500" />
                Fitness Profile
              </CardTitle>
              <a
                href="/onboarding"
                className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700"
              >
                <Pencil className="h-3 w-3" />
                Edit
              </a>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {goalStats.map(({ icon: Icon, label, value }) => (
                <div
                  key={label}
                  className="flex items-start gap-2.5 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5"
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                  <div>
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className="text-sm font-medium capitalize text-gray-900">
                      {value?.toLowerCase()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {goal.equipment?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {goal.equipment.map((eq) => (
                  <Badge key={eq} variant="gray">
                    <Dumbbell className="mr-1 h-3 w-3" />
                    {eq.replace(/_/g, ' ')}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Telegram */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-4 w-4 text-gray-500" />
            Telegram Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {user?.telegramId ? (
            <div className="flex items-center justify-between rounded-lg border border-green-100 bg-green-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-green-800">Account linked</p>
                  <p className="text-xs text-green-600">ID: {user.telegramId}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" loading={unlinkingTg} onClick={unlinkTelegram}>
                <Link2Off className="mr-1.5 h-3.5 w-3.5" />
                Unlink
              </Button>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600">
                Link your Telegram account to chat with FitCoach from the bot.
              </p>
              <ol className="space-y-1.5 text-sm text-gray-600">
                {[
                  'Open Telegram and search for @fitness_23CoachBot',
                  'Send any message (e.g. "hi")',
                  'The bot will reply with your Telegram ID',
                  'Paste it below and click Link',
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
              <div className="flex gap-2">
                <Input
                  placeholder="Your Telegram ID (e.g. 123456789)"
                  value={telegramId}
                  onChange={(e) => setTelegramId(e.target.value)}
                />
                <Button size="sm" loading={linkingTg} onClick={linkTelegram}>
                  <LinkIcon className="mr-1.5 h-3.5 w-3.5" />
                  Link
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-gray-500" />
            Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Clear Chat History</p>
              <p className="text-xs text-gray-500">Remove conversation context from the AI</p>
            </div>
            <Button variant="outline" size="sm" onClick={clearChat}>
              <Trash2 className="mr-1.5 h-3.5 w-3.5 text-red-500" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
