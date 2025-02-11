import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  Alert,
} from 'react-native';
import { Button, Input } from 'react-native-elements';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import Geolocation from '@react-native-community/geolocation';
import { Picker } from '@react-native-picker/picker';

const categories = [
  "Damaged Road",
  "Garbage Overflow",
  "Street Light Issue",
  "Water Supply",
  "Drainage Problem",
  "Public Property Damage",
  "Illegal Construction",
  "Tree Hazard",
  "Other",
];

export function ReportIssueScreen({ navigation }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    category: '',
    coordinates: { lat: 0, lng: 0 },
  });
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImageCapture = async () => {
    const options = {
      mediaType: 'photo',
      quality: 1,
      maxWidth: 1280,
      maxHeight: 1280,
      saveToPhotos: true,
    };

    try {
      const result = await launchCamera(options);
      if (result.assets && result.assets[0]) {
        setImage(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture image');
    }
  };

  const getCurrentLocation = () => {
    setLoading(true);
    Geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await response.json();
          setFormData(prev => ({
            ...prev,
            location: data.display_name,
            coordinates: { lat: latitude, lng: longitude },
          }));
        } catch (error) {
          Alert.alert('Error', 'Failed to get address from coordinates');
        }
        setLoading(false);
      },
      (error) => {
        Alert.alert('Error', 'Failed to get location');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.description || !formData.location || !formData.category) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    if (!image) {
      Alert.alert('Error', 'Please add a photo of the issue');
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement API call to submit the issue
      const response = await fetch('YOUR_API_ENDPOINT/issues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          imageUrl: image.uri,
        }),
      });

      if (!response.ok) throw new Error('Failed to submit issue');

      Alert.alert('Success', 'Issue reported successfully');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to submit issue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Report a Civic Issue</Text>

        <Input
          placeholder="Issue Title"
          value={formData.title}
          onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
          containerStyle={styles.inputContainer}
        />

        <View style={styles.pickerContainer}>
          <Text style={styles.label}>Category</Text>
          <Picker
            selectedValue={formData.category}
            onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
            <Picker.Item label="Select a category" value="" />
            {categories.map((category) => (
              <Picker.Item key={category} label={category} value={category} />
            ))}
          </Picker>
        </View>

        <Input
          placeholder="Description"
          value={formData.description}
          onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
          multiline
          numberOfLines={4}
          containerStyle={styles.inputContainer}
        />

        <View style={styles.locationContainer}>
          <Input
            placeholder="Location"
            value={formData.location}
            onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
            containerStyle={[styles.inputContainer, { flex: 1 }]}
          />
          <Button
            title="📍"
            onPress={getCurrentLocation}
            loading={loading}
            containerStyle={styles.locationButton}
          />
        </View>

        <TouchableOpacity 
          style={styles.imageContainer} 
          onPress={handleImageCapture}
        >
          {image ? (
            <Image
              source={{ uri: image.uri }}
              style={styles.image}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>📸 Tap to take a photo</Text>
              <Text style={styles.placeholderSubtext}>
                Take a clear photo of the issue
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <Button
          title="Submit Report"
          onPress={handleSubmit}
          loading={loading}
          containerStyle={styles.submitButton}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  pickerContainer: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  label: {
    fontSize: 16,
    color: '#86939e',
    marginLeft: 10,
    marginTop: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationButton: {
    width: 50,
  },
  imageContainer: {
    width: '100%',
    height: 300,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#999',
  },
  submitButton: {
    marginBottom: 32,
  },
});
