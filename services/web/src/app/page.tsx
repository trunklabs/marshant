import Link from 'next/link';
import { headers } from 'next/headers';
import { Button } from '@/ui/button';
import { Card, CardContent } from '@/ui/card';
import { Badge } from '@/ui/badge';
import { ModeToggle } from '@/components/mode-toggle';
import { Logo } from '@/components/logo';
import { auth } from '@/lib/auth';
import {
  ToggleRight,
  Layers,
  Shield,
  Zap,
  Github,
  Code2,
  Server,
  Globe,
  ArrowRight,
  Star,
  CheckCircle2,
} from 'lucide-react';
import { WaitlistForm } from '@/components/waitlist-form';

export default async function LandingPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const isLoggedIn = !!session?.user;

  return (
    <div className="flex min-h-screen w-full flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Logo />

          <nav className="hidden items-center gap-6 md:flex">
            <Link href="#features" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
              Features
            </Link>
            <Link href="#sdks" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
              SDKs
            </Link>
            <Link
              href="https://github.com/trunklabs/marshant"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              GitHub
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <ModeToggle />
            {isLoggedIn ? (
              <Button asChild>
                <Link href="/app">
                  Go to App
                  <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>
            ) : (
              <Button asChild>
                <Link href="/auth/sign-up">Get Started</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto max-w-6xl px-4 py-24 text-center md:py-32">
          <Badge variant="secondary" className="mb-6">
            Open Source
          </Badge>
          <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
            Feature Flags
            <br />
            <span className="text-muted-foreground">without the complexity</span>
          </h1>
          <p className="text-muted-foreground mx-auto mb-8 max-w-2xl text-lg md:text-xl">
            Self-hosted, open-source feature flag management. Simple setup, no paywall, no compromises. Ship features
            with confidence.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            {isLoggedIn ? (
              <Button size="lg" asChild>
                <Link href="/app">
                  Go to Dashboard
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            ) : (
              <Button size="lg" asChild>
                <Link href="/auth/sign-up">
                  Get Started
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            )}
            <Button size="lg" variant="outline" asChild>
              <Link href="https://github.com/trunklabs/marshant" target="_blank" rel="noopener noreferrer">
                <Github className="mr-2 size-4" />
                Star on GitHub
              </Link>
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="border-t py-24">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">Everything you need</h2>
              <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
                Powerful feature flag management without the bloat. Focus on what matters — shipping features.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                icon={<Layers className="size-6" />}
                title="Projects & Environments"
                description="Organize flags into projects with multiple environments. Dev, staging, production — all in one place."
              />
              <FeatureCard
                icon={<ToggleRight className="size-6" />}
                title="Flexible Flag Types"
                description="Boolean, string, number, or JSON values. Return exactly what your application needs."
              />
              <FeatureCard
                icon={<Shield className="size-6" />}
                title="Targeting & Gates"
                description="Target specific users or groups with actor-based gates. Roll out features gradually with precision."
              />
              <FeatureCard
                icon={<Zap className="size-6" />}
                title="Simple & Fast"
                description="No complex setup or steep learning curve. Get started in minutes, not hours."
              />
              <FeatureCard
                icon={<Server className="size-6" />}
                title="Self-Hosted"
                description="Run on your own infrastructure. Full control over your data with no vendor lock-in."
              />
              <FeatureCard
                icon={<Code2 className="size-6" />}
                title="Developer First"
                description="Clean API, type-safe SDKs, and a UI that gets out of your way."
              />
            </div>
          </div>
        </section>

        {/* SDKs Section */}
        <section id="sdks" className="border-t py-24">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">SDKs for your stack</h2>
              <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
                Integrate Marshant into your application with our official SDKs.
              </p>
            </div>

            <div className="mx-auto grid max-w-3xl gap-4 md:grid-cols-2">
              <SDKCard name="JavaScript / TypeScript" status="available" icon={<Code2 className="size-5" />} />
              <SDKCard name="React" status="available" icon={<Code2 className="size-5" />} />
              <SDKCard name="Node.js" status="available" icon={<Server className="size-5" />} />
              <SDKCard name="Python" status="coming" icon={<Code2 className="size-5" />} />
              <SDKCard name="Go" status="coming" icon={<Code2 className="size-5" />} />
              <SDKCard name="REST API" status="available" icon={<Globe className="size-5" />} />
            </div>
          </div>
        </section>

        {/* Open Source Section */}
        <section className="border-t py-24">
          <div className="container mx-auto max-w-6xl px-4">
            <Card className="bg-card/50 mx-auto max-w-3xl text-center">
              <CardContent className="py-12">
                <div className="bg-muted mx-auto mb-6 flex size-16 items-center justify-center rounded-full">
                  <Github className="size-8" />
                </div>
                <h2 className="mb-4 text-2xl font-bold md:text-3xl">Open Source & Free Forever</h2>
                <p className="text-muted-foreground mx-auto mb-8 max-w-xl">
                  Marshant is fully open source under the MIT license. Self-host for free with no feature limitations or
                  hidden paywalls.
                </p>
                <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <Button size="lg" variant="outline" asChild>
                    <Link href="https://github.com/trunklabs/marshant" target="_blank" rel="noopener noreferrer">
                      <Star className="mr-2 size-4" />
                      Star on GitHub
                    </Link>
                  </Button>
                  <Button size="lg" variant="ghost" asChild>
                    <Link href="https://github.com/trunklabs/marshant" target="_blank" rel="noopener noreferrer">
                      View Source
                      <ArrowRight className="ml-2 size-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Cloud Coming Soon */}
        <section className="border-t py-24">
          <div className="container mx-auto max-w-6xl px-4 text-center">
            <Badge variant="outline" className="mb-6">
              Coming Soon
            </Badge>
            <h2 className="mb-4 text-2xl font-bold md:text-3xl">Marshant Cloud</h2>
            <p className="text-muted-foreground mx-auto max-w-xl">
              Don&apos;t want to self-host? We&apos;re building a managed cloud version. Join the waitlist to be
              notified when it launches.
            </p>
            <WaitlistForm />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <Logo size="sm" asLink={false} />

            <nav className="flex flex-wrap items-center justify-center gap-6">
              <Link
                href="https://github.com/trunklabs/marshant"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                GitHub
              </Link>
              <Link href="#features" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                Features
              </Link>
              <Link href="#sdks" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                SDKs
              </Link>
            </nav>

            <p className="text-muted-foreground text-sm">© {new Date().getFullYear()} Marshant. All right reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <Card className="bg-card/50 hover:bg-card transition-colors">
      <CardContent className="pt-6">
        <div className="bg-muted mb-4 flex size-12 items-center justify-center rounded-lg">{icon}</div>
        <h3 className="mb-2 text-lg font-semibold">{title}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </CardContent>
    </Card>
  );
}

function SDKCard({ name, status, icon }: { name: string; status: 'available' | 'coming'; icon: React.ReactNode }) {
  return (
    <Card className="bg-card/50">
      <CardContent className="flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <div className="text-muted-foreground">{icon}</div>
          <span className="font-medium">{name}</span>
        </div>
        {status === 'available' ? (
          <Badge variant="secondary" className="gap-1">
            <CheckCircle2 className="size-3" />
            Available
          </Badge>
        ) : (
          <Badge variant="outline">Coming Soon</Badge>
        )}
      </CardContent>
    </Card>
  );
}
