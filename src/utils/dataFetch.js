// utils/dataFetch.js
import api from '../services/api';

export const fetchUserProfile = async () => {
  try {
    const response = await api.getCurrentUser();
    if (response.success && response.user) {
      return response.user;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

export const fetchExercises = async () => {
  try {
    const response = await api.getExercises();
    if (response.success && response.exercises) {
      return response.exercises;
    }
    return [];
  } catch (error) {
    console.error('Error fetching exercises:', error);
    return [];
  }
};

export const fetchExerciseById = async (id) => {
  try {
    const response = await api.getExerciseById(id);
    if (response.success && response.exercise) {
      return response.exercise;
    }
    return null;
  } catch (error) {
    console.error('Error fetching exercise:', error);
    return null;
  }
};

export const fetchIngredients = async () => {
  try {
    const response = await api.getIngredients();
    if (response.success && response.ingredients) {
      return response.ingredients;
    }
    return [];
  } catch (error) {
    console.error('Error fetching ingredients:', error);
    return [];
  }
};

export const fetchIngredientById = async (id) => {
  try {
    const response = await api.getIngredientById(id);
    if (response.success && response.ingredient) {
      return response.ingredient;
    }
    return null;
  } catch (error) {
    console.error('Error fetching ingredient:', error);
    return null;
  }
};

export const fetchRecommendedMeals = async (date) => {
  try {
    const response = await api.getRecommendedMeals(date);
    if (response.success && response.meals) {
      return response.meals;
    }
    return [];
  } catch (error) {
    console.error('Error fetching recommended meals:', error);
    return [];
  }
};

export const fetchNutritionTargets = async () => {
  try {
    const response = await api.getNutritionTargets();
    if (response.success && response.targets) {
      return response.targets;
    }
    return null;
  } catch (error) {
    console.error('Error fetching nutrition targets:', error);
    return null;
  }
};