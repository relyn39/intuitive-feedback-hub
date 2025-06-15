
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResetPasswordDialog } from '@/components/ResetPasswordDialog';
import AuthForm, { authSchema, AuthFormValues } from '@/components/AuthForm';

const AuthPage = () => {
    const navigate = useNavigate();
    const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

    const loginForm = useForm<AuthFormValues>({
        resolver: zodResolver(authSchema),
        defaultValues: { email: '', password: '' },
    });

    const onLogin = async (values: AuthFormValues) => {
        const { error } = await supabase.auth.signInWithPassword({
            email: values.email,
            password: values.password,
        });
        if (error) {
            toast.error(error.message);
        } else {
            toast.success('Login realizado com sucesso!');
            navigate('/');
        }
    };

    const signInWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
        });
        if (error) {
            toast.error(error.message);
        }
    };

    return (
        <div className="flex justify-center items-center h-full p-4 bg-muted/40">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Login</CardTitle>
                    <CardDescription>Acesse sua conta para continuar.</CardDescription>
                </CardHeader>
                <CardContent>
                    <AuthForm 
                        form={loginForm}
                        onSubmit={onLogin}
                    />
                    <div className="mt-4 flex justify-center">
                        <Button variant="link" className="p-0 h-auto" onClick={() => setIsResetDialogOpen(true)}>
                            Esqueceu sua senha?
                        </Button>
                    </div>
                    <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                                Ou continue com
                            </span>
                        </div>
                    </div>
                    <Button variant="outline" className="w-full" onClick={signInWithGoogle}>
                        Entrar com Google
                    </Button>
                </CardContent>
            </Card>
            <ResetPasswordDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen} />
        </div>
    );
};

export default AuthPage;
