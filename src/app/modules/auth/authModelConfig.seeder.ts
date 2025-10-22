import { AuthModelConfig } from "./authModelConfig.model";

export const seedAuthModelConfigs = async () => {
  try {
    // Check if configs already exist
    const existingCount = await AuthModelConfig.countDocuments();

    if (existingCount > 0) {
      console.log("Auth model configurations already exist. Skipping seed.");
      return;
    }

    // Default configuration for SystemUser
    const defaultConfig = {
      modelName: "SystemUser",
      importPath: "../modules/systemUser/systemUser.model",
      exportName: "SystemUser",
      selectFields: "isActive email role userId",
      statusField: "isActive",
      statusFieldInverted: true, // isActive should be true
      priority: 1,
      isActive: true,
    };

    await AuthModelConfig.create(defaultConfig);

    console.log("Auth model configurations seeded successfully!");
  } catch (error) {
    console.error("Error seeding auth model configurations:", error);
    throw error;
  }
};
