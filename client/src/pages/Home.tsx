import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Users, Lock, BarChart3 } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">HSC</span>
            </div>
            <span className="text-xl font-bold text-white">HSC Admin Portal</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/admin/login">
              <Button variant="outline" className="border-slate-600 text-slate-100 hover:bg-slate-700">
                Admin Login
              </Button>
            </Link>
            <Link href="/user/login">
              <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                User Login
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight">
                Manage Your Team <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Efficiently</span>
              </h1>
              <p className="text-xl text-slate-400">
                A powerful admin portal to manage employees, track activities, and control access with ease.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/user/login">
                <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 h-12 text-base w-full sm:w-auto">
                  Get Started <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-slate-600 text-slate-100 hover:bg-slate-700 px-8 h-12 text-base w-full sm:w-auto"
                >
                  Create Account
                </Button>
              </Link>
            </div>

            <p className="text-sm text-slate-500">
              Already have an account? <Link href="/user/login" className="text-blue-400 hover:text-blue-300 font-medium">Sign in here</Link>
            </p>
          </div>

          <div className="hidden md:flex items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur-3xl opacity-20"></div>
              <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-8 shadow-xl">
                <div className="space-y-4">
                  <div className="h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full w-3/4"></div>
                  <div className="h-3 bg-slate-700 rounded-full w-1/2"></div>
                  <div className="space-y-2">
                    <div className="h-2 bg-slate-700 rounded-full"></div>
                    <div className="h-2 bg-slate-700 rounded-full w-5/6"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="border-t border-slate-700/50 bg-slate-900/50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Powerful Features</h2>
            <p className="text-xl text-slate-400">Everything you need to manage your organization</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-6 hover:border-blue-500/50 transition-colors">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Team Management</h3>
              <p className="text-slate-400">Easily manage and organize your team members with detailed profiles and information.</p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-6 hover:border-blue-500/50 transition-colors">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Secure Access</h3>
              <p className="text-slate-400">Role-based access control and two-factor authentication for enhanced security.</p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-6 hover:border-blue-500/50 transition-colors">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Analytics</h3>
              <p className="text-slate-400">Track activities and get insights into your team's performance and engagement.</p>
            </div>

            {/* Feature 4 */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-6 hover:border-blue-500/50 transition-colors">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Fast & Reliable</h3>
              <p className="text-slate-400">Lightning-fast performance and reliable service for your business needs.</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-2xl p-12 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-blue-100 mb-8">Join thousands of teams managing their workforce efficiently.</p>
          <Link href="/user/login">
            <Button 
              size="lg" 
              className="bg-white text-purple-600 hover:bg-slate-100 px-8 h-12 text-base font-semibold"
            >
              Login Now <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 bg-slate-900/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-400">© 2024 HSC Admin Portal. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="text-slate-400 hover:text-slate-300 transition-colors">Privacy</a>
              <a href="#" className="text-slate-400 hover:text-slate-300 transition-colors">Terms</a>
              <a href="#" className="text-slate-400 hover:text-slate-300 transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
