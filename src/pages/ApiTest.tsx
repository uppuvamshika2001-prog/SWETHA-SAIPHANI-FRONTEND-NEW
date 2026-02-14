import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff } from 'lucide-react';

export default function ApiTest() {
    const [results, setResults] = useState<string[]>([]);
    const [email, setEmail] = useState('admin@email.com');
    const [password, setPassword] = useState('admin123');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const addResult = (msg: string) => {
        setResults(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };

    const testLogin = async () => {
        setLoading(true);
        addResult(`Testing login with: ${email}`);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            addResult(`Status: ${response.status}`);
            addResult(`Response: ${JSON.stringify(data, null, 2)}`);

            if (data.tokens?.accessToken) {
                localStorage.setItem('accessToken', data.tokens.accessToken);
                localStorage.setItem('refreshToken', data.tokens.refreshToken);
                addResult('✅ Tokens saved to localStorage');
            }
        } catch (error: any) {
            addResult(`❌ Error: ${error.message}`);
        }
        setLoading(false);
    };

    const testGetMe = async () => {
        setLoading(true);
        addResult('Testing /api/auth/me...');

        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch('/api/auth/me', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            addResult(`Status: ${response.status}`);
            addResult(`Response: ${JSON.stringify(data, null, 2)}`);
        } catch (error: any) {
            addResult(`❌ Error: ${error.message}`);
        }
        setLoading(false);
    };

    const testPatients = async () => {
        setLoading(true);
        addResult('Testing /api/patients...');

        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch('/api/patients', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            addResult(`Status: ${response.status}`);
            addResult(`Response: ${JSON.stringify(data, null, 2).substring(0, 500)}...`);
        } catch (error: any) {
            addResult(`❌ Error: ${error.message}`);
        }
        setLoading(false);
    };

    const testUsers = async () => {
        setLoading(true);
        addResult('Testing /api/users...');

        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch('/api/users', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            addResult(`Status: ${response.status}`);
            addResult(`Response: ${JSON.stringify(data, null, 2).substring(0, 500)}...`);
        } catch (error: any) {
            addResult(`❌ Error: ${error.message}`);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <Card className="max-w-4xl mx-auto">
                <CardHeader>
                    <CardTitle>🔌 API Connection Test</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <div className="relative flex-1">
                            <Input
                                placeholder="Password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pr-10"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                            </Button>
                        </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                        <Button onClick={testLogin} disabled={loading}>
                            Test Login
                        </Button>
                        <Button onClick={testGetMe} disabled={loading} variant="outline">
                            Test /auth/me
                        </Button>
                        <Button onClick={testPatients} disabled={loading} variant="outline">
                            Test /patients
                        </Button>
                        <Button onClick={testUsers} disabled={loading} variant="outline">
                            Test /users
                        </Button>
                        <Button onClick={() => setResults([])} variant="destructive">
                            Clear
                        </Button>
                    </div>

                    <div className="bg-black text-green-400 p-4 rounded font-mono text-sm h-96 overflow-auto">
                        {results.length === 0 ? (
                            <p className="text-gray-500">Click a button to test API endpoints...</p>
                        ) : (
                            results.map((r, i) => <pre key={i} className="whitespace-pre-wrap">{r}</pre>)
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
