
import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const authSchema = z.object({
  email: z.string().email({ message: 'Por favor, insira um email válido.' }),
  password: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres.' }),
});

type AuthFormValues = z.infer<typeof authSchema>;

const AuthForm = ({ type, form, onSubmit }: { 
    type: 'login' | 'signup',
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
                            <Input type="password" placeholder="••••••••" {...field} autoComplete={type === 'login' ? 'current-password' : 'new-password'} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting 
                    ? (type === 'login' ? 'Entrando...' : 'Criando conta...') 
                    : (type === 'login' ? 'Entrar' : 'Criar conta')}
            </Button>
        </form>
    </Form>
);

const AuthPage = () => {
    const navigate = useNavigate();

    const loginForm = useForm<AuthFormValues>({
        resolver: zodResolver(authSchema),
        defaultValues: { email: '', password: '' },
    });
    
    const signupForm = useForm<AuthFormValues>({
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

    const onSignup = async (values: AuthFormValues) => {
        const { error } = await supabase.auth.signUp({
            email: values.email,
            password: values.password,
            options: {
                emailRedirectTo: `${window.location.origin}/`,
            },
        });
        if (error) {
            toast.error(error.message);
        } else {
            toast.info('Cadastro realizado! Verifique seu email para confirmar sua conta.');
        }
    };
    
    return (
        <div className="flex justify-center items-center h-full p-4 bg-muted/40">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Autenticação</CardTitle>
                    <CardDescription>Acesse sua conta ou cadastre-se para continuar.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="login" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="login">Login</TabsTrigger>
                            <TabsTrigger value="signup">Cadastro</TabsTrigger>
                        </TabsList>
                        <TabsContent value="login" className="pt-6">
                            <AuthForm 
                                type="login"
                                form={loginForm}
                                onSubmit={onLogin}
                            />
                        </TabsContent>
                        <TabsContent value="signup" className="pt-6">
                             <AuthForm 
                                type="signup"
                                form={signupForm}
                                onSubmit={onSignup}
                            />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
};

export default AuthPage;
