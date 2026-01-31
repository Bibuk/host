import Link from 'next/link';
import { ArrowRight, Shield, Users, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <Shield className="h-6 w-6 text-primary" />
            <span>UserApp</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Войти</Button>
            </Link>
            <Link href="/register">
              <Button>Регистрация</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl lg:text-6xl font-bold tracking-tight mb-6">
            Добро пожаловать в
            <span className="text-primary"> UserApp</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Управляйте своим аккаунтом, настройками безопасности и профилем 
            в одном удобном месте
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register">
              <Button size="lg">
                Начать сейчас
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                Уже есть аккаунт
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Возможности
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card rounded-lg p-6 shadow-sm">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Профиль</h3>
              <p className="text-muted-foreground">
                Управляйте личными данными, аватаром и контактной информацией
              </p>
            </div>
            <div className="bg-card rounded-lg p-6 shadow-sm">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Безопасность</h3>
              <p className="text-muted-foreground">
                Смена пароля, управление сессиями и двухфакторная аутентификация
              </p>
            </div>
            <div className="bg-card rounded-lg p-6 shadow-sm">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Уведомления</h3>
              <p className="text-muted-foreground">
                Получайте важные уведомления о вашем аккаунте и активности
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2026 UserApp. Все права защищены.</p>
        </div>
      </footer>
    </div>
  );
}
