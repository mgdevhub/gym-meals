import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

const COLORS = {
    background: '#121212',
    card: '#1E1E1E',
    primary: '#CCFF00',
    text: '#FFFFFF',
    textSecondary: '#AAAAAA',
};

const AuthScreen = ({ onSignIn = () => console.log("Default onSignIn called") }) => {
    const [loading, setLoading] = useState(false);

    // Google Sign In Configuration
    const googleWebClientId = Constants.expoConfig?.extra?.googleWebClientId || 'DEMO-MODE';

    const discovery = {
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenEndpoint: 'https://oauth2.googleapis.com/token',
    };

    const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'com.gymmeals.app',
        path: 'redirect'
    });

    const [request, response, promptAsync] = AuthSession.useAuthRequest(
        {
            clientId: googleWebClientId,
            scopes: ['openid', 'profile', 'email'],
            redirectUri,
        },
        discovery
    );

    React.useEffect(() => {
        if (response?.type === 'success') {
            const { authentication } = response;
            handleGoogleSuccess(authentication);
        }
    }, [response]);

    const handleGoogleSuccess = async (authentication) => {
        try {
            // Fetch user info from Google
            const userInfoResponse = await fetch(
                'https://www.googleapis.com/oauth2/v3/userinfo',
                {
                    headers: { Authorization: `Bearer ${authentication.accessToken}` },
                }
            );
            const userInfo = await userInfoResponse.json();

            const userData = {
                id: userInfo.sub,
                email: userInfo.email,
                name: userInfo.name,
                picture: userInfo.picture,
                provider: 'google'
            };

            onSignIn(userData);
        } catch (error) {
            console.error('Google sign in error:', error);
            Alert.alert('Error', 'Failed to sign in with Google');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        try {
            if (googleWebClientId === 'DEMO-MODE' || googleWebClientId.includes('DEMO')) {
                // Demo mode - skip OAuth for development
                Alert.alert(
                    '🚀 Demo Mode',
                    'Google Sign In works! In production, this will use real Google authentication.\n\nFor now, creating demo account...',
                    [
                        {
                            text: 'Continue',
                            onPress: () => {
                                const demoUser = {
                                    id: 'demo-' + Date.now(),
                                    email: 'demo@gymmeals.app',
                                    name: 'Demo User',
                                    picture: null,
                                    provider: 'google-demo'
                                };
                                onSignIn(demoUser);
                            }
                        }
                    ]
                );
                setLoading(false);
            } else {
                // Real Google OAuth
                await promptAsync();
            }
        } catch (error) {
            console.error('Google sign in error:', error);
            Alert.alert('Error', 'Failed to sign in with Google');
            setLoading(false);
        }
    };

    const handleAppleSignIn = async () => {
        setLoading(true);
        try {
            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
            });

            const userData = {
                id: credential.user,
                email: credential.email,
                name: credential.fullName ? `${credential.fullName.givenName || ''} ${credential.fullName.familyName || ''}`.trim() : null,
                provider: 'apple'
            };

            onSignIn(userData);
        } catch (error) {
            if (error.code === 'ERR_CANCELED') {
                // User cancelled
            } else {
                Alert.alert('Error', 'Failed to sign in with Apple');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Image source={require('./assets/images/icon.png')} style={{ width: 120, height: 120, marginBottom: 24, borderRadius: 20 }} />
                <Text style={styles.title}>GymMeals</Text>
                <Text style={styles.subtitle}>Fit Meals, Every Day 💪</Text>

                <View style={styles.buttonsContainer}>
                    {Platform.OS === 'ios' && (
                        <TouchableOpacity
                            style={[styles.button, styles.appleButton]}
                            onPress={handleAppleSignIn}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#000" />
                            ) : (
                                <>
                                    <MaterialCommunityIcons name="apple" size={24} color="#000" style={{ marginRight: 12 }} />
                                    <Text style={styles.appleButtonText}>Continue with Apple</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={[styles.button, styles.googleButton]}
                        onPress={handleGoogleSignIn}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <>
                                <MaterialCommunityIcons name="google" size={24} color="#FFF" style={{ marginRight: 12 }} />
                                <Text style={styles.googleButtonText}>Continue with Google</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: '#333', marginTop: 10 }]}
                        onPress={() => onSignIn({ id: 'guest', name: 'Guest User', email: null, provider: 'guest' })}
                        disabled={loading}
                    >
                        <MaterialCommunityIcons name="account-outline" size={24} color="#FFF" style={{ marginRight: 12 }} />
                        <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '600' }}>Continue as Guest</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.disclaimer}>
                    By continuing, you agree to our{'\n'}
                    Terms of Service and Privacy Policy
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        color: COLORS.text,
        marginTop: 20,
    },
    subtitle: {
        fontSize: 18,
        color: COLORS.textSecondary,
        marginTop: 8,
        marginBottom: 60,
    },
    buttonsContainer: {
        width: '100%',
        maxWidth: 320,
        gap: 16,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        width: '100%',
    },
    appleButton: {
        backgroundColor: '#FFFFFF',
    },
    appleButtonText: {
        color: '#000000',
        fontSize: 16,
        fontWeight: '600',
    },
    googleButton: {
        backgroundColor: '#4285F4',
    },
    googleButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    disclaimer: {
        marginTop: 40,
        fontSize: 12,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 18,
    },
});

export default AuthScreen;
