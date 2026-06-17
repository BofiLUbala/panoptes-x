const {
  withAndroidManifest,
  withDangerousMod,
} = require('expo/config-plugins');
const path = require('path');
const fs = require('fs');

function addSmsPermissions(androidManifest) {
  const manifest = androidManifest.manifest;
  if (!manifest['uses-permission']) {
    manifest['uses-permission'] = [];
  }
  const existing = manifest['uses-permission'].map(
    (p) => p['$']['android:name']
  );
  const needed = [
    'android.permission.RECEIVE_SMS',
    'android.permission.READ_SMS',
  ];
  for (const perm of needed) {
    if (!existing.includes(perm)) {
      manifest['uses-permission'].push({
        $: { 'android:name': perm },
      });
    }
  }
  return androidManifest;
}

function addSmsReceiver(androidManifest) {
  const application = androidManifest.manifest.application;
  if (!application) return androidManifest;

  const app = Array.isArray(application) ? application[0] : application;
  if (!app.receiver) {
    app.receiver = [];
  }
  const receivers = Array.isArray(app.receiver) ? app.receiver : [app.receiver];

  const alreadyExists = receivers.some(
    (r) => r.$ && r.$['android:name'] === '.SmsReceiver'
  );
  if (!alreadyExists) {
    receivers.push({
      $: {
        'android:name': '.SmsReceiver',
        'android:exported': 'true',
        'android:permission': 'android.permission.BROADCAST_SMS',
      },
      'intent-filter': [
        {
          action: [{ $: { 'android:name': 'android.provider.Telephony.SMS_RECEIVED' } }],
        },
      ],
    });
    app.receiver = receivers;
  }
  return androidManifest;
}

function getPackageName(config) {
  return config.android?.package || 'com.panoptesx.app';
}

function getAndroidSrcDir(platformRoot, packageName) {
  const pkgPath = packageName.replace(/\./g, path.sep);
  return path.join(platformRoot, 'app', 'src', 'main', 'java', pkgPath);
}

function patchMainApplication(mainAppPath, packageName) {
  let content = fs.readFileSync(mainAppPath, 'utf8');
  const importLine = `import ${packageName}.SmsPackage;`;
  const addLine = `            packages.add(new SmsPackage());`;

  if (content.includes('SmsPackage')) return;

  if (!content.includes(importLine)) {
    const lastImport = content.lastIndexOf('import ');
    const afterLastImport = content.indexOf('\n', lastImport);
    content =
      content.slice(0, afterLastImport + 1) +
      importLine +
      '\n' +
      content.slice(afterLastImport + 1);
  }

  const packagesPattern = /packages\.add\(new MainReactPackage\(\)\);/;
  if (packagesPattern.test(content)) {
    content = content.replace(
      packagesPattern,
      `packages.add(new MainReactPackage());\n${addLine}`
    );
  }

  fs.writeFileSync(mainAppPath, content, 'utf8');
}

module.exports = function withSmsReceiver(config) {
  config = withAndroidManifest(config, (config) => {
    config.modResults = addSmsPermissions(config.modResults);
    config.modResults = addSmsReceiver(config.modResults);
    return config;
  });

  config = withDangerousMod(config, [
    'android',
    (config) => {
      const platformRoot = config.modRequest.platformProjectRoot;
      const packageName = getPackageName(config);
      const srcDir = getAndroidSrcDir(platformRoot, packageName);

      if (!fs.existsSync(srcDir)) {
        fs.mkdirSync(srcDir, { recursive: true });
      }

      const javaFiles = ['SmsReceiver.java', 'SmsModule.java', 'SmsPackage.java'];
      const pluginDir = path.join(
        config.modRequest.projectRoot,
        'plugins'
      );

      for (const file of javaFiles) {
        const srcPath = path.join(pluginDir, file);
        const destPath = path.join(srcDir, file);
        if (fs.existsSync(srcPath)) {
          fs.copyFileSync(srcPath, destPath);
        }
      }

      const mainAppPath = path.join(srcDir, 'MainApplication.java');
      if (fs.existsSync(mainAppPath)) {
        patchMainApplication(mainAppPath, packageName);
      }

      return config;
    },
  ]);

  return config;
};
