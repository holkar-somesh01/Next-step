import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Admin Dashboard',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="schemes"
        options={{
          title: 'Scheme Form',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="users"
        options={{
          title: 'Manage Users',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="contacts"
        options={{
          title: 'Contact Inquiries',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="sidebar"
        options={{
          title: 'Menu',
          headerShown: false,
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
