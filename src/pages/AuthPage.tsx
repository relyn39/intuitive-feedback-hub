import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ResetPasswordDialog } from '@/components/ResetPasswordDialog';

const authSchema = z.object({
  email: z.string().email({ message: 'Por favor, insira um email válido.' }),
  password: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres.' }),
});

type AuthFormValues = z.infer<typeof authSchema>;

const AuthForm = ({ form, onSubmit }: { 
    form: ReturnType<typeof useForm<AuthFormValues>>,
    onSubmit: (values: AuthFormValues) => Promise<void>,
}) => (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                            <Input placeholder="seu@email.com" {...field} autoComplete="email" />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Senha</FormLabel>
                        <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} autoComplete='current-password' />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Entrando...' : 'Entrar'}
            </Button>
        </form>
    </Form>
);

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
