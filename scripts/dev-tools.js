(function timeTravelReset() {
    // CHANGE THIS NUMBER to jump further into the future (2 = 48 hours, 3 = 72 hours, etc.)
    const daysToJump = 1; 
    
    const RealDate = Date;
    const offset = daysToJump * 24 * 60 * 60 * 1000; 

    window.Date = class extends RealDate {
        constructor(...args) {
            if (args.length === 0) return new RealDate(RealDate.now() + offset);
            return new RealDate(...args);
        }
        static now() {
            return RealDate.now() + offset;
        }
    };

    console.log(`⏰ Time shifted ${daysToJump} days into the future. Waiting for the interval...`);

    setTimeout(() => { 
        window.Date = RealDate; 
        console.log("✅ Time restored to normal."); 
    }, 2000);
})();