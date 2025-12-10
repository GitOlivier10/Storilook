#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(StorilookCameraModule, RCTEventEmitter)
RCT_EXTERN_METHOD(captureAndSavePhoto:(NSString *)eventId)
@end
